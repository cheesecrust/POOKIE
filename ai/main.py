from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List
import os, uuid, datetime, math, re
import numpy as np
import cv2
import mediapipe as mp

# ================== 기본 설정 ==================
RESULTS_ROOT = os.getenv("RESULTS_ROOT", "/app/results_debug")
os.makedirs(RESULTS_ROOT, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://i13a604.p.ssafy.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== MediaPipe 초기화 ==================
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=1,
    enable_segmentation=False
)
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.3
)
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# ================== 상반신 랜드마크 ==================
UPPER_BODY_LANDMARKS = {
    mp_pose.PoseLandmark.NOSE,
    mp_pose.PoseLandmark.LEFT_EYE, mp_pose.PoseLandmark.RIGHT_EYE,
    mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.RIGHT_EAR,
    mp_pose.PoseLandmark.MOUTH_LEFT, mp_pose.PoseLandmark.MOUTH_RIGHT,
    mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
    mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW,
    mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST,
}
ALLOWED_POSE_IDX = {lm.value for lm in UPPER_BODY_LANDMARKS}
POSE_INDEX_LIST = sorted(ALLOWED_POSE_IDX)  # 순서 고정

POSE_DIMS = len(POSE_INDEX_LIST) * 2
HAND_POINTS_PER_HAND = 21
HAND_DIMS = HAND_POINTS_PER_HAND * 2 * 2  # 84

# ================== 손 판정 튜닝 파라미터 ==================
HAND_VIS_TH  = 0.45
ROI_ALPHA    = 0.45
ROI_SIZE_B   = 1.4
ROI_COVER_TH = 0.50
NEAR_TH_MULT = 0.8

# ================== 유틸/전처리 ==================
def preprocess_image(image_bgr: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)

def _slug(s, default):
    s = (s or default).strip().lower()
    return re.sub(r'[^a-z0-9._-]+', '-', s) or default

def atomic_write(image_bgr, target_path: str):
    root, ext = os.path.splitext(target_path)
    tmp = f"{root}.tmp{ext}"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if not cv2.imwrite(tmp, image_bgr):
        raise RuntimeError(f"cv2.imwrite failed: {tmp}")
    os.replace(tmp, target_path)

def _mirror_xy(v_xy_flat: np.ndarray) -> np.ndarray:
    m = v_xy_flat.reshape(-1, 2).copy()
    m[:, 0] *= -1
    return m.reshape(-1)

def _box_cover_ratio(box, w, h):
    x1,y1,x2,y2 = box
    X1,Y1 = max(0,int(x1)), max(0,int(y1))
    X2,Y2 = min(w,int(x2)), min(h,int(y2))
    inter = max(0, X2-X1) * max(0, Y2-Y1)
    area  = max(1, int(x2-x1)) * max(1, int(y2-y1))
    return inter / area

def _hand_centroid(hand_lms, w, h):
    xs = [lm.x * w for lm in hand_lms.landmark]
    ys = [lm.y * h for lm in hand_lms.landmark]
    return float(np.mean(xs)), float(np.mean(ys))

# 좌우 라벨 정렬 + ROI 기대/실측 판정 (+ 동일 손 중복 배정 방지)
def _hand_points_and_conf(image_bgr, w, h, wrists=None, elbows=None, vis=None):
    pts, confs, draw = [], [], []
    result = hands.process(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    detected = []
    if getattr(result, "multi_hand_landmarks", None):
        for i, hand in enumerate(result.multi_hand_landmarks):
            cx, cy = _hand_centroid(hand, w, h)
            score = 0.0
            if getattr(result, "multi_handedness", None):
                score = float(result.multi_handedness[i].classification[0].score)
            detected.append({"centroid": (cx, cy), "score": score, "lms": hand})

    status = {"L": "absent_or_uncertain", "R": "absent_or_uncertain"}
    rois   = {}
    assigned_idx = {"L": None, "R": None}
    used_ids = set()

    def make_roi(side):
        if wrists is None or elbows is None: return None, 0.0, 0.0
        w_pt = np.array(wrists[side], dtype=np.float32)
        e_pt = np.array(elbows[side], dtype=np.float32)
        fore_len = float(np.linalg.norm(w_pt - e_pt))
        if fore_len < 5.0:
            return None, 0.0, fore_len
        dir_vec = (w_pt - e_pt)
        if np.linalg.norm(dir_vec) > 1e-6:
            dir_vec = dir_vec / np.linalg.norm(dir_vec)
        c = w_pt + ROI_ALPHA * fore_len * dir_vec
        half = 0.5 * ROI_SIZE_B * fore_len
        box = (c[0]-half, c[1]-half, c[0]+half, c[1]+half)
        cover = _box_cover_ratio(box, w, h)
        return box, cover, fore_len

    for side in ("L", "R"):
        roi, cover, fore_len = make_roi(side)
        rois[side] = {"box": roi, "cover": cover, "fore_len": fore_len}
        if roi is None:
            continue
        v_w = vis["LW"] if side == "L" else vis["RW"]
        v_e = vis["LE"] if side == "L" else vis["RE"]
        expect = (v_w >= HAND_VIS_TH and v_e >= HAND_VIS_TH and cover >= ROI_COVER_TH)

        if expect and detected:
            cx_roi = (roi[0]+roi[2])/2; cy_roi = (roi[1]+roi[3])/2
            best = None; best_d = 1e9; best_idx = -1
            for idx, d in enumerate(detected):
                if idx in used_ids:
                    continue
                dcx, dcy = d["centroid"]
                dist = math.hypot(dcx - cx_roi, dcy - cy_roi)
                if dist <= max(8.0, NEAR_TH_MULT * fore_len) and dist < best_d:
                    best, best_d, best_idx = d, dist, idx
            if best is not None:
                used_ids.add(best_idx)
                assigned_idx[side] = best_idx
                status[side] = "present_detected"
            else:
                status[side] = "present_missed"
        elif expect and not detected:
            status[side] = "present_missed"
        else:
            status[side] = "absent_or_uncertain"

    def pick_index_for_side(side_char, label_text):
        idx = assigned_idx[side_char]
        if idx is not None:
            return idx
        if getattr(result, "multi_handedness", None) and detected:
            for i, d in enumerate(detected):
                if i in used_ids:
                    continue
                lab = result.multi_handedness[i].classification[0].label
                if lab == label_text:
                    used_ids.add(i)
                    return i
        bx = rois[side_char]["box"]
        if detected and bx is not None:
            cx_roi, cy_roi = (bx[0]+bx[2])/2, (bx[1]+bx[3])/2
            best_i, best_d = None, 1e9
            for i, d in enumerate(detected):
                if i in used_ids:
                    continue
                dcx, dcy = d["centroid"]
                dist = math.hypot(dcx - cx_roi, dcy - cy_roi)
                if dist < best_d:
                    best_i, best_d = i, dist
            if best_i is not None:
                used_ids.add(best_i)
                return best_i
        return None

    for side_char, label_text in (("L", "Left"), ("R", "Right")):
        idx = pick_index_for_side(side_char, label_text)
        if idx is not None:
            hand = detected[idx]
            hp = [[lm.x * w, lm.y * h] for lm in hand["lms"].landmark]
            pts.extend(hp); confs.extend([hand["score"]]*len(hp)); draw.append(hand["lms"])
        else:
            pts.extend([[-1.0, -1.0]] * HAND_POINTS_PER_HAND); confs.extend([0.0]*HAND_POINTS_PER_HAND)

    # 손 메타에 vis 저장 
    return (np.array(pts, np.float32),
            np.array(confs, np.float32),
            draw,
            {"status": status, "rois": rois, "vis": dict(vis or {})})


# ================== “아무 포즈도 안함(idle)” 판정 함수 ==================
def _is_idle_pose(hand_meta, vis_dict):
    # 팔꿈치·손목 모두 신뢰도 낮고, 손도 양쪽 다 'absent_or_uncertain' 이면 idle
    lw = vis_dict.get("LW", 0.0); rw = vis_dict.get("RW", 0.0)
    le = vis_dict.get("LE", 0.0); re = vis_dict.get("RE", 0.0)
    wrists_low  = (lw < HAND_VIS_TH) and (rw < HAND_VIS_TH)
    elbows_low  = (le < HAND_VIS_TH) and (re < HAND_VIS_TH)
    hands_absent = all(s == "absent_or_uncertain" for s in hand_meta["status"].values())
    return wrists_low and elbows_low and hands_absent


# ================== 상반신 벡터/신뢰도 추출 ==================
def extract_upper_body_vectors(image_bytes: bytes, filename: str, save_dir: str, save_prefix: str = ""):
    os.makedirs(save_dir, exist_ok=True)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return None

    image = preprocess_image(image)
    h, w = image.shape[:2]

    pres = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if not pres.pose_landmarks:
        return None

    pose_xy = []
    pose_conf = []
    raw_xy = {}
    for idx in POSE_INDEX_LIST:
        lm = pres.pose_landmarks.landmark[idx]
        x, y = lm.x * w, lm.y * h
        pose_xy.append([x, y])
        c = float(max(0.0, min(1.0, getattr(lm, "visibility", 0.0))))
        pose_conf.append(c)
        raw_xy[idx] = [x, y]
    pose_xy = np.array(pose_xy, dtype=np.float32)
    pose_conf = np.array(pose_conf, dtype=np.float32)

    NOSE = mp_pose.PoseLandmark.NOSE.value
    LSH, RSH = mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    if any(i not in raw_xy for i in [NOSE, LSH, RSH]):
        return None

    nose = np.array(raw_xy[NOSE], dtype=np.float32)
    LS = np.array(raw_xy[LSH], dtype=np.float32)
    RS = np.array(raw_xy[RSH], dtype=np.float32)

    LW, RW = mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.RIGHT_WRIST.value
    LE, RE = mp_pose.PoseLandmark.LEFT_ELBOW.value, mp_pose.PoseLandmark.RIGHT_ELBOW.value
    if any(i not in raw_xy for i in [LW, RW, LE, RE]):
        wrists = elbows = None
        vis = {"LW":0.0,"RW":0.0,"LE":0.0,"RE":0.0}
    else:
        wrists = {"L": np.array(raw_xy[LW], dtype=np.float32),
                  "R": np.array(raw_xy[RW], dtype=np.float32)}
        elbows = {"L": np.array(raw_xy[LE], dtype=np.float32),
                  "R": np.array(raw_xy[RE], dtype=np.float32)}
        vis = {
            "LW": float(pres.pose_landmarks.landmark[LW].visibility),
            "RW": float(pres.pose_landmarks.landmark[RW].visibility),
            "LE": float(pres.pose_landmarks.landmark[LE].visibility),
            "RE": float(pres.pose_landmarks.landmark[RE].visibility),
        }

    hand_xy, hand_conf, hand_draw, hand_meta = _hand_points_and_conf(
                        image, w, h, wrists=wrists, elbows=elbows, vis=vis)

    mask = (hand_xy[:, 0] < 0) & (hand_xy[:, 1] < 0)
    if np.any(mask):
        hand_xy[mask] = nose

    pose_xy -= nose
    hand_xy -= nose

    v = RS - LS
    theta = math.atan2(v[1], v[0])
    c, s = math.cos(-theta), math.sin(-theta)
    R = np.array([[c, -s], [s, c]], dtype=np.float32)
    pose_xy = pose_xy @ R.T
    hand_xy = hand_xy @ R.T

    LS0 = (LS - nose) @ R.T
    RS0 = (RS - nose) @ R.T
    shoulder_width = float(np.linalg.norm(RS0 - LS0))
    if shoulder_width < 1e-6:
        bbox = pose_xy.max(0) - pose_xy.min(0)
        shoulder_width = float(np.max(bbox))
        if shoulder_width < 1e-6:
            return None
    pose_xy /= shoulder_width
    hand_xy /= shoulder_width

    vec_xy = np.concatenate([pose_xy.reshape(-1), hand_xy.reshape(-1)], axis=0).astype(np.float32)
    vec_conf = np.concatenate([pose_conf, hand_conf], axis=0).astype(np.float32)

    has_world = getattr(pres, "pose_world_landmarks", None) is not None
    if has_world:
        world = pres.pose_world_landmarks.landmark
        z_vals = []
        for idx in POSE_INDEX_LIST:
            z_vals.append(world[idx].z)
        z_vals = np.array(z_vals, dtype=np.float32)
        z_nose = world[NOSE].z
        z_vals = (z_vals - z_nose)
        sw_world = np.linalg.norm(
            np.array([world[RSH].x - world[LSH].x, world[RSH].y - world[LSH].y, world[RSH].z - world[LSH].z],
                     dtype=np.float32)
        )
        z_scale = sw_world if sw_world > 1e-6 else 1.0
        z_vals = z_vals / z_scale
    else:
        z_vals = np.zeros(len(POSE_INDEX_LIST), dtype=np.float32)

    pose_xyz = np.concatenate([pose_xy, z_vals.reshape(-1, 1)], axis=1)
    vec_xyz = pose_xyz.reshape(-1).astype(np.float32)

    # ---- 시각화 저장 (prefix 반영) ----
    annotated = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_drawing.draw_landmarks(
        annotated, pres.pose_landmarks, mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
    )
    for hl in hand_draw:
        mp_drawing.draw_landmarks(
            annotated, hl, mp_hands.HAND_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_hand_landmarks_style()
        )
    name_base = os.path.splitext(os.path.basename(filename))[0]
    prefix_part = (save_prefix + "_") if save_prefix else ""
    vis_path = os.path.join(save_dir, f"vis_{prefix_part}{name_base}.jpg")
    atomic_write(cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR), vis_path)

    is_idle = _is_idle_pose(hand_meta, vis)

    return {
        "vec_xy": vec_xy,
        "vec_xyz": vec_xyz,
        "vec_conf": vec_conf,
        "vis_path": vis_path,
        "has_world": bool(has_world),
        "hand_meta": hand_meta,
        "is_idle": bool(is_idle),
    }

# ================== 유사도(Confidence Distance: CDmax) ==================
def _per_keypoint_cos_nd(a_flat: np.ndarray, b_flat: np.ndarray, dim: int) -> np.ndarray:
    A = a_flat.reshape(-1, dim)
    B = b_flat.reshape(-1, dim)
    num = (A * B).sum(axis=1)
    den = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-6
    cos = num / den
    zero = (np.linalg.norm(A, axis=1) < 1e-6) | (np.linalg.norm(B, axis=1) < 1e-6)
    cos[zero] = 0.0
    return cos

def _split_xy(v_flat: np.ndarray):
    body = v_flat[:POSE_DIMS]
    hand = v_flat[POSE_DIMS:POSE_DIMS + HAND_DIMS]
    return body, hand

def confidence_distance_2d(
    p_xy, q_xy, p_conf, q_conf,
    scheme_body="max", scheme_hand="both",
    allow_mirror=True, w_body=0.6, w_hand=0.4,
    use_hand=True
):
    pb, ph = _split_xy(p_xy)
    qb, qh = _split_xy(q_xy)

    pc_body = p_conf[:len(POSE_INDEX_LIST)]
    qc_body = q_conf[:len(POSE_INDEX_LIST)]
    pc_hand = p_conf[len(POSE_INDEX_LIST):]
    qc_hand = q_conf[len(POSE_INDEX_LIST):]

    def weight(c1, c2, scheme):
        if scheme == "p":    return c1
        if scheme == "q":    return c2
        if scheme == "avg":  return 0.5 * (c1 + c2)
        if scheme == "both": return np.minimum(c1, c2)
        return np.maximum(c1, c2)

    def cd_part(a, b, ca, cb, scheme):
        cos_k = _per_keypoint_cos_nd(a, b, dim=2)
        w = weight(ca, cb, scheme)
        wsum = float(w.sum())
        if wsum < 1e-6:
            return None, 0.0
        return float((w * cos_k).sum() / (wsum + 1e-6)), wsum

    s_body, _ = cd_part(pb, qb, pc_body, qc_body, scheme_body)

    s_hand = None
    if use_hand:
        pL, pR = ph[:42], ph[42:84]
        qL, qR = qh[:42], qh[42:84]
        pcL, pcR = pc_hand[:21], pc_hand[21:42]
        qcL, qcR = qc_hand[:21], qc_hand[21:42]

        sL, wL = cd_part(pL, qL, pcL, qcL, scheme_hand)
        sR, wR = cd_part(pR, qR, pcR, qcR, scheme_hand)

        Ws = []; Ss = []
        if sL is not None: Ws.append(wL); Ss.append(sL)
        if sR is not None: Ws.append(wR); Ss.append(sR)
        if len(Ws) > 0:
            s_hand = float(np.average(Ss, weights=Ws))

    def blend(a, b):
        if b is None:
            return a
        return (w_body * a + w_hand * b) / (w_body + w_hand)

    s0 = blend(s_body, s_hand)

    if not allow_mirror:
        return s0
    
    # 미러 버전
    qb_m = _mirror_xy(qb)
    qh_m = _mirror_xy(qh)
    s_body_m, _ = cd_part(pb, qb_m, pc_body, qc_body, scheme_body)

    s_hand_m = None
    if use_hand:
        qLm, qRm = qh_m[:42], qh_m[42:84]
        sL_m, wL_m = cd_part(pL, qLm, pcL, qcL, scheme_hand)
        sR_m, wR_m = cd_part(pR, qRm, pcR, qcR, scheme_hand)
        Ws_m = []; Ss_m = []
        if sL_m is not None: Ws_m.append(wL_m); Ss_m.append(sL_m)
        if sR_m is not None: Ws_m.append(wR_m); Ss_m.append(sR_m)
        if len(Ws_m) > 0:
            s_hand_m = float(np.average(Ss_m, weights=Ws_m))

    s1 = blend(s_body_m, s_hand_m)
    return max(s0, s1)

def confidence_distance_3d(p_xyz_flat, q_xyz_flat, p_conf_body, q_conf_body, scheme="max", allow_mirror=True):
    cos_k = _per_keypoint_cos_nd(p_xyz_flat, q_xyz_flat, dim=3)
    if scheme == "p": w = p_conf_body
    elif scheme == "q": w = q_conf_body
    elif scheme == "avg": w = 0.5 * (p_conf_body + q_conf_body)
    else: w = np.maximum(p_conf_body, q_conf_body)
    s0 = float((w * cos_k).sum() / (w.sum() + 1e-6))

    if not allow_mirror:
        return s0

    Q = q_xyz_flat.reshape(-1, 3).copy()
    Q[:, 0] *= -1
    cos_m = _per_keypoint_cos_nd(p_xyz_flat, Q.reshape(-1), dim=3)
    s1 = float((w * cos_m).sum() / (w.sum() + 1e-6))
    return max(s0, s1)

# ===== 쌍별(hand pair) 사전검사: 규칙 3·4 구현 =====
def _expected_hand_set(meta):
    # present_detected 또는 present_missed(있어야 하나 미검출)만 “사용 의도”로 간주
    return {s for s, st in meta["status"].items() if st in ("present_detected", "present_missed")}

def _hands_pair_ok(mi, mj, allow_cross_side_single=False):
    Si = _expected_hand_set(mi); Sj = _expected_hand_set(mj)
    if len(Si) != len(Sj):
        return False, f"different hand count: {sorted(Si)} vs {sorted(Sj)}"
    if len(Si) == 1 and Si != Sj:
        # 세 명 모두가 '한 손만' 상황이면 좌우 반대 허용
        if allow_cross_side_single:
            return True, None
        return False, f"different single-hand side: {sorted(Si)} vs {sorted(Sj)}"
    return True, None

# ================== Row 이미지 생성 ==================
def concat_images_horizontally_with_text(image_paths, similarities, all_pass, save_path="result_row.jpg"):
    images = []
    for p in image_paths:
        img = cv2.imread(p)
        if img is not None:
            images.append(img)
    if not images:
        return None
    h, w = images[0].shape[:2]
    resized = [cv2.resize(img, (w, h)) for img in images]
    concat_img = cv2.hconcat(resized)
    text = f"1-2: {similarities['1-2']:.3f}, 1-3: {similarities['1-3']:.3f}, 2-3: {similarities['2-3']:.3f}"
    status = "✅ Match!" if all_pass else "❌ Not Match!"
    cv2.putText(concat_img, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(concat_img, status, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                (0, 200, 0) if all_pass else (0, 0, 255), 2)
    atomic_write(concat_img, save_path)
    return save_path

# ================== API ==================
KST = datetime.timezone(datetime.timedelta(hours=9))

# 튜닝 파라미터
PASS_THRESHOLD = 0.60          # ← 낮춤 (이상이면 통과)
PASS_POLICY    = "majority"    # all | majority | ref
W_BODY_2D, W_HAND_2D = 0.7, 0.3
DEPTH_BLEND = 0.35

@app.post("/ai/upload_images")
async def upload_images(
    images: List[UploadFile] = File(...),
    gameId: str | None = Query(default="unknown-game"),
    team: str | None = Query(default="unknown-team"),
    round_idx: int | None = Query(default=1, alias="round"),
):
    if len(images) != 3:
        return JSONResponse({"ok": False, "message": "정확히 3장의 이미지를 업로드해야 합니다."}, status_code=400)

    gameId = _slug(gameId, "unknown-game")
    team   = _slug(team, "unknown-team")
    round_num = int(round_idx or 1)

    # ── 폴더: /results/{YYYY-MM-DD}/{gameId}/ ──
    today_dir = datetime.datetime.now(KST).strftime("%Y-%m-%d")
    base_dir  = os.path.join(RESULTS_ROOT, today_dir, gameId)
    os.makedirs(base_dir, exist_ok=True)

    # 파일 prefix: rXX_team
    prefix = f"r{round_num:02d}_{team}"

    vecs_xy, vecs_xyz, confs, vis_paths = [], [], [], []
    hand_metas = []

    idle_flags = []
    for file in images:
        contents = await file.read()
        out = extract_upper_body_vectors(contents, file.filename, save_dir=base_dir, save_prefix=prefix)
        if out is None:
            return JSONResponse({"ok": False, "message": f"키포인트 추출 실패: {file.filename}"}, status_code=422)
        vecs_xy.append(out["vec_xy"])
        vecs_xyz.append(out["vec_xyz"])
        confs.append(out["vec_conf"])
        vis_paths.append(out["vis_path"])
        hand_metas.append(out["hand_meta"])
        idle_flags.append(bool(out.get("is_idle", False)))

    # ── 규칙 #1: 모두 idle이면 => 아무 포즈도 안하면 무조건 탈락 ──
    all_idle = all(idle_flags)

    # ── 규칙 #2 준비: 세 명 모두 '한 손만'인지 체크 ──
    def _hand_count(meta): return len(_expected_hand_set(meta))
    all_onehand = all(_hand_count(m) == 1 for m in hand_metas)

    # ── (쌍별) 손 패턴 사전검사 ──
    pairs = [(0,1), (1,2), (0,2)]
    pair_gate = {}
    for a,b in pairs:
        ok, reason = _hands_pair_ok(hand_metas[a], hand_metas[b],
                                    allow_cross_side_single=all_onehand)
        pair_gate[f"{a+1}-{b+1}"] = {"ok": ok, "reason": reason}

    # ── 유사도 점수 계산 ──
    def pair_score(i, j):
        key = f"{i+1}-{j+1}"
        if not pair_gate[key]["ok"]:
            return 0.0
        s2d = confidence_distance_2d(
            vecs_xy[i], vecs_xy[j], confs[i], confs[j],
            scheme_body="max", scheme_hand="both",
            allow_mirror=True, w_body=W_BODY_2D, w_hand=W_HAND_2D,
            use_hand=True
        )
        # 3D는 몸만(손 3D 없음)
        bi, bj = confs[i][:len(POSE_INDEX_LIST)], confs[j][:len(POSE_INDEX_LIST)]
        s3d = confidence_distance_3d(vecs_xyz[i], vecs_xyz[j], bi, bj, scheme="max", allow_mirror=True)
        return (1 - DEPTH_BLEND) * s2d + DEPTH_BLEND * s3d

    s12 = pair_score(0, 1)
    s13 = pair_score(0, 2)
    s23 = pair_score(1, 2)

    # 최종 판정
    if all_idle:
        match = False   # 규칙 #1 강제 탈락
    else:
        if PASS_POLICY == "all":
            match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD and s23 >= PASS_THRESHOLD)
        elif PASS_POLICY == "ref":
            match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD)
        else:
            match = (sum(s >= PASS_THRESHOLD for s in [s12, s13, s23]) >= 2)

    similarities = {"1-2": round(s12, 3), "1-3": round(s13, 3), "2-3": round(s23, 3)}

    # ── Row 이미지 생성/저장 (파일명으로만 구분) ──
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(base_dir, f"{prefix}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
    team_round_latest = os.path.join(base_dir, f"latest_{team}_r{round_num:02d}.jpg")
    overall_latest = os.path.join(base_dir, "latest.jpg")

    concat_path = concat_images_horizontally_with_text(vis_paths, similarities, match, save_path=archive)
    if concat_path:
        img = cv2.imread(concat_path)
        if img is not None:
            atomic_write(img, team_round_latest)  # 팀·라운드 최신본
            atomic_write(img, overall_latest)    # 게임 전체 최신본

    # 손 상태 요약
    hand_status = [{"L": m["status"]["L"], "R": m["status"]["R"]} for m in hand_metas]

    # 응답
    return {
        "ok": True,
        "all_pass": bool(match),
        "scores": similarities,
        "vis_files": [os.path.basename(v) for v in vis_paths],
        "row_file_archive": os.path.basename(archive) if concat_path else None,
        "row_file_team_round_latest": os.path.basename(team_round_latest),
        "row_file_latest": os.path.basename(overall_latest),
        "results_url_base": f"/results/{today_dir}/{gameId}/",
        "hand_status": hand_status,
        "pair_gate": pair_gate,
        "rule_flags": {"all_idle": all_idle, "all_onehand": all_onehand},
        "idle_per_image": idle_flags,
    }

# 정적 서빙
app.mount("/results", StaticFiles(directory=RESULTS_ROOT, check_dir=False), name="results")
# 예: http://<host>:<port>/results/2025-08-11/<gameId>/