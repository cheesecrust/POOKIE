from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List
import os, uuid, datetime, math, re
import numpy as np
import cv2
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity  # (Row 이미지 텍스트만 유지 시 불필요하면 제거 가능)

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
    model_complexity=1,           # world_landmarks 품질을 위해 1 권장
    enable_segmentation=False
)
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5,  # 손 검출 안정성↑
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

POSE_DIMS = len(POSE_INDEX_LIST) * 2   # (x,y) for upper body
HAND_POINTS_PER_HAND = 21
HAND_DIMS = HAND_POINTS_PER_HAND * 2 * 2  # 두 손(좌/우) × 21점 × (x,y) = 84

# ================== 손 판정 튜닝 파라미터 ==================
HAND_VIS_TH  = 0.45   # wrist/elbow visibility 기준
ROI_ALPHA    = 0.45   # 손목→손 방향으로 나가는 비율 (팔뚝 길이 * alpha)
ROI_SIZE_B   = 1.4    # ROI 한 변 크기 = 팔뚝 길이 * beta
ROI_COVER_TH = 0.50   # ROI가 화면 안에 포함돼야 하는 최소 비율
NEAR_TH_MULT = 0.8    # ROI 중심과 검출 손 중심 거리 허용 배수(팔뚝 길이 * mult)

# ================== 정책 플래그(손 패턴 규칙) ==================
# 'ignore'               : 손 패턴 무시 (점수만으로 결정)
# 'consistent_detected'  : present_detected 손 세트가 모두 동일해야 통과
# 'consistent_expected'  : present_detected 또는 present_missed(있어야 하나 미검출) 세트가 모두 동일해야 통과  ← 기본/추천
# 우선은 기본으로 진행
HAND_RULE = "consistent_expected"

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

    # 1) 실측(Hands) 후보 정리
    detected = []
    if getattr(result, "multi_hand_landmarks", None):
        for i, hand in enumerate(result.multi_hand_landmarks):
            cx, cy = _hand_centroid(hand, w, h)
            score = 0.0
            if getattr(result, "multi_handedness", None):
                score = float(result.multi_handedness[i].classification[0].score)
            detected.append({"centroid": (cx, cy), "score": score, "lms": hand})

    # 2) 기대 ROI 생성 + 판정
    status = {"L": "absent_or_uncertain", "R": "absent_or_uncertain"}  # 기본값
    rois   = {}
    assigned_idx = {"L": None, "R": None}
    used_ids = set()  # 동일 손의 중복 배정 방지

    def make_roi(side):
        if wrists is None or elbows is None: return None, 0.0, 0.0
        w_pt = np.array(wrists[side], dtype=np.float32)
        e_pt = np.array(elbows[side], dtype=np.float32)
        fore_len = float(np.linalg.norm(w_pt - e_pt))
        if fore_len < 5.0:
            return None, 0.0, fore_len
        # 손 방향으로 alpha만큼 나간 위치를 중심, fore_len*beta 크기의 정사각 ROI
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
        # visibility 조건
        v_w = vis["LW"] if side == "L" else vis["RW"]
        v_e = vis["LE"] if side == "L" else vis["RE"]
        expect = (v_w >= HAND_VIS_TH and v_e >= HAND_VIS_TH and cover >= ROI_COVER_TH)

        if expect and detected:
            cx_roi = (roi[0]+roi[2])/2; cy_roi = (roi[1]+roi[3])/2
            best = None; best_d = 1e9; best_idx = -1
            for idx, d in enumerate(detected):
                if idx in used_ids:  # 이미 다른 쪽에 배정된 손은 스킵
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

    # 3) 좌/우 출력용 landmark 선택 (배정된 인덱스 우선, 그 외 라벨/근접 보정)
    def pick_index_for_side(side_char, label_text):
        # 3-1) ROI 매칭으로 이미 배정된 경우
        idx = assigned_idx[side_char]
        if idx is not None:
            return idx
        # 3-2) 라벨로 매칭 (아직 안 쓴 손만)
        if getattr(result, "multi_handedness", None) and detected:
            for i, d in enumerate(detected):
                if i in used_ids:
                    continue
                lab = result.multi_handedness[i].classification[0].label
                if lab == label_text:
                    used_ids.add(i)
                    return i
        # 3-3) ROI에 가장 가까운 손 (아직 안 쓴 손만)
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

    return (np.array(pts, np.float32),
            np.array(confs, np.float32),
            draw,
            {"status": status, "rois": rois})

# ================== 상반신 벡터/신뢰도 추출 ==================
def extract_upper_body_vectors(image_bytes: bytes, filename: str, save_dir: str):
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

    # Pose XY/Conf(visibility) - 상반신만, 고정된 인덱스 순서
    pose_xy = []
    pose_conf = []
    raw_xy = {}  # 이미지 좌표계에서의 원본 (nose/어깨/손목 계산용)
    for idx in POSE_INDEX_LIST:
        lm = pres.pose_landmarks.landmark[idx]
        x, y = lm.x * w, lm.y * h
        pose_xy.append([x, y])
        c = float(max(0.0, min(1.0, getattr(lm, "visibility", 0.0))))
        pose_conf.append(c)
        raw_xy[idx] = [x, y]
    pose_xy = np.array(pose_xy, dtype=np.float32)
    pose_conf = np.array(pose_conf, dtype=np.float32)

    # 필수 포인트 확인
    NOSE = mp_pose.PoseLandmark.NOSE.value
    LSH, RSH = mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    if any(i not in raw_xy for i in [NOSE, LSH, RSH]):
        return None

    nose = np.array(raw_xy[NOSE], dtype=np.float32)
    LS = np.array(raw_xy[LSH], dtype=np.float32)
    RS = np.array(raw_xy[RSH], dtype=np.float32)

    # 손목/팔꿈치/가시성
    LW, RW = mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.RIGHT_WRIST.value
    LE, RE = mp_pose.PoseLandmark.LEFT_ELBOW.value, mp_pose.PoseLandmark.RIGHT_ELBOW.value
    if any(i not in raw_xy for i in [LW, RW, LE, RE]):
        # 손/팔꿈치가 전혀 없으면 그냥 기본 로직 유지(손은 sentinel)
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

    # Hands XY/Conf (좌/우 순서 강제) + 메타
    hand_xy, hand_conf, hand_draw, hand_meta = _hand_points_and_conf(image, w, h, wrists=wrists, elbows=elbows, vis=vis)

    # ---- 누락 손 좌표 sentinel(-1,-1) → nose로 치환 후 평행이동하면 0이 되도록 ----
    mask = (hand_xy[:, 0] < 0) & (hand_xy[:, 1] < 0)  # sentinel
    if np.any(mask):
        hand_xy[mask] = nose  # 이후 nose 원점화에서 (0,0)로 정리됨

    # ---- 정규화: nose 원점화 → 어깨선 수평 회전 → 어깨너비 스케일 ----
    # 1) 평행이동
    pose_xy -= nose
    hand_xy -= nose

    # 2) 회전(어깨선 수평)
    v = RS - LS
    theta = math.atan2(v[1], v[0])  # Z축 회전 각
    c, s = math.cos(-theta), math.sin(-theta)
    R = np.array([[c, -s], [s, c]], dtype=np.float32)
    pose_xy = pose_xy @ R.T
    hand_xy = hand_xy @ R.T

    # 3) 스케일(어깨너비)
    LS0 = (LS - nose) @ R.T
    RS0 = (RS - nose) @ R.T
    shoulder_width = float(np.linalg.norm(RS0 - LS0))
    if shoulder_width < 1e-6:
        # fallback: bbox 기반
        bbox = pose_xy.max(0) - pose_xy.min(0)
        shoulder_width = float(np.max(bbox))
        if shoulder_width < 1e-6:
            return None
    pose_xy /= shoulder_width
    hand_xy /= shoulder_width

    # ---- 2D 벡터/신뢰도 결합 ----
    vec_xy = np.concatenate([pose_xy.reshape(-1), hand_xy.reshape(-1)], axis=0).astype(np.float32)
    vec_conf = np.concatenate([pose_conf, hand_conf], axis=0).astype(np.float32)  # 길이: len(POSE_INDEX_LIST)+42

    # ---- 3D(Depth) 준비: world Z 사용 가능하면 섞기 ----
    has_world = getattr(pres, "pose_world_landmarks", None) is not None
    if has_world:
        world = pres.pose_world_landmarks.landmark
        z_vals = []
        for idx in POSE_INDEX_LIST:
            z_vals.append(world[idx].z)  # meters (음수=카메라 앞으로)
        z_vals = np.array(z_vals, dtype=np.float32)

        # nose/어깨 기준으로 XY는 이미 정규화됨. Z만 정규화(어깨너비의 world 스케일로)
        z_nose = world[NOSE].z
        z_vals = (z_vals - z_nose)

        # world 상에서의 어깨 간 거리로 스케일링(가능)
        sw_world = np.linalg.norm(
            np.array([world[RSH].x - world[LSH].x, world[RSH].y - world[LSH].y, world[RSH].z - world[LSH].z],
                     dtype=np.float32)
        )
        z_scale = sw_world if sw_world > 1e-6 else 1.0
        z_vals = z_vals / z_scale
    else:
        # world가 없으면 z=0으로 채움(=2D만)
        z_vals = np.zeros(len(POSE_INDEX_LIST), dtype=np.float32)

    pose_xyz = np.concatenate([pose_xy, z_vals.reshape(-1, 1)], axis=1)  # (K,3)
    vec_xyz = pose_xyz.reshape(-1).astype(np.float32)

    # ---- 시각화 저장 ----
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
    vis_path = os.path.join(save_dir, f"vis_{name_base}.jpg")
    atomic_write(cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR), vis_path)

    return {
        "vec_xy": vec_xy,
        "vec_xyz": vec_xyz,
        "vec_conf": vec_conf,
        "vis_path": vis_path,
        "has_world": bool(has_world),
        "hand_meta": hand_meta,   # ← 손 상태 포함 (L/R별 present_detected 등)
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
    return cos  # shape: (K,)

def _split_xy(v_flat: np.ndarray):
    body = v_flat[:POSE_DIMS]
    hand = v_flat[POSE_DIMS:POSE_DIMS + HAND_DIMS]
    return body, hand

# 손은 L/R을 분리하여 "있는 만큼만" 부분 반영 (없으면 자동 제외)
def confidence_distance_2d(
    p_xy, q_xy, p_conf, q_conf,
    scheme_body="max", scheme_hand="both",
    allow_mirror=True, w_body=0.6, w_hand=0.4,
    use_hand=True
):
    pb, ph = _split_xy(p_xy)
    qb, qh = _split_xy(q_xy)

    # 신뢰도 분리
    pc_body = p_conf[:len(POSE_INDEX_LIST)]
    qc_body = q_conf[:len(POSE_INDEX_LIST)]
    pc_hand = p_conf[len(POSE_INDEX_LIST):]   # len = 42 (21 L + 21 R)
    qc_hand = q_conf[len(POSE_INDEX_LIST):]

    def weight(c1, c2, scheme):
        if scheme == "p":    return c1
        if scheme == "q":    return c2
        if scheme == "avg":  return 0.5 * (c1 + c2)
        if scheme == "both": return np.minimum(c1, c2)  # 교집합 가중(공통 포인트만 반영)
        return np.maximum(c1, c2)  # "max"

    def cd_part(a, b, ca, cb, scheme):
        cos_k = _per_keypoint_cos_nd(a, b, dim=2)
        w = weight(ca, cb, scheme)
        wsum = float(w.sum())
        if wsum < 1e-6:
            return None, 0.0
        return float((w * cos_k).sum() / (wsum + 1e-6)), wsum

    # --- 몸 점수 ---
    s_body, _ = cd_part(pb, qb, pc_body, qc_body, scheme_body)

    # --- 손 점수: L/R 분리 ---
    s_hand = None
    if use_hand:
        # 좌/우 슬라이스 (좌표는 21*2=42개, 신뢰도는 21개)
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
    else: w = np.maximum(p_conf_body, q_conf_body)  # "max"
    s0 = float((w * cos_k).sum() / (w.sum() + 1e-6))

    if not allow_mirror:
        return s0

    Q = q_xyz_flat.reshape(-1, 3).copy()
    Q[:, 0] *= -1  # x 반전
    cos_m = _per_keypoint_cos_nd(p_xyz_flat, Q.reshape(-1), dim=3)
    s1 = float((w * cos_m).sum() / (w.sum() + 1e-6))
    return max(s0, s1)

# ================== Row 이미지 생성(옵션) ==================
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
PASS_THRESHOLD = 0.86          # 상반신 웹캠 권장 0.84~0.90
PASS_POLICY    = "majority"    # "all" | "majority" | "ref"
W_BODY_2D, W_HAND_2D = 0.7, 0.3
DEPTH_BLEND = 0.35             # 2D:3D 가중(0~0.5 추천)

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

    today_dir = datetime.datetime.now(KST).strftime("%Y-%m-%d")
    game_dir = os.path.join(RESULTS_ROOT, today_dir, gameId, team)
    os.makedirs(game_dir, exist_ok=True)

    vecs_xy, vecs_xyz, confs, vis_paths, has_worlds = [], [], [], [], []
    hand_metas = []
    names = []

    for file in images:
        contents = await file.read()
        names.append(file.filename)
        out = extract_upper_body_vectors(contents, file.filename, save_dir=game_dir)
        if out is None:
            return JSONResponse({"ok": False, "message": f"키포인트 추출 실패: {file.filename}"}, status_code=422)
        vecs_xy.append(out["vec_xy"])
        vecs_xyz.append(out["vec_xyz"])
        confs.append(out["vec_conf"])
        vis_paths.append(out["vis_path"])
        has_worlds.append(out["has_world"])
        hand_metas.append(out["hand_meta"])

    # ---- 손 패턴 규칙 검사 ----
    def visible_detected(meta):
        return {s for s, st in meta["status"].items() if st == "present_detected"}
    def visible_expected(meta):
        return {s for s, st in meta["status"].items() if st in ("present_detected", "present_missed")}

    if HAND_RULE != "ignore":
        sets = [frozenset(visible_expected(m)) if HAND_RULE == "consistent_expected"
                else frozenset(visible_detected(m)) for m in hand_metas]
        hand_rule_ok = (len(set(sets)) == 1)
        hand_rule_reason = None if hand_rule_ok else f"hand pattern mismatch: {list(map(list, sets))}"
    else:
        hand_rule_ok = True
        hand_rule_reason = None

    # ---- 유사도 점수 계산 ----
    def pair_score(i, j):
        s2d = confidence_distance_2d(
            vecs_xy[i], vecs_xy[j], confs[i], confs[j],
            scheme_body="max", scheme_hand="both",
            allow_mirror=True, w_body=W_BODY_2D, w_hand=W_HAND_2D,
            use_hand=True  # 부분 반영 로직이 알아서 처리
        )
        # 3D는 몸만(손 3D 없음)
        bi, bj = confs[i][:len(POSE_INDEX_LIST)], confs[j][:len(POSE_INDEX_LIST)]
        s3d = confidence_distance_3d(vecs_xyz[i], vecs_xyz[j], bi, bj,
                                     scheme="max", allow_mirror=True)
        return (1 - DEPTH_BLEND) * s2d + DEPTH_BLEND * s3d

    s12 = pair_score(0, 1)
    s13 = pair_score(0, 2)
    s23 = pair_score(1, 2)

    if PASS_POLICY == "all":
        match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD and s23 >= PASS_THRESHOLD)
    elif PASS_POLICY == "ref":
        match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD)  # 1번 기준
    else:  # majority
        match = (sum(s >= PASS_THRESHOLD for s in [s12, s13, s23]) >= 2)

    # 손 패턴 규칙 위반 시 즉시 실패
    if not hand_rule_ok:
        match = False

    similarities = {"1-2": round(s12, 3), "1-3": round(s13, 3), "2-3": round(s23, 3)}

    # Row 이미지 생성/저장
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(game_dir, f"r{round_num}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
    round_alias = os.path.join(game_dir, f"round-{round_num}.jpg")
    latest_alias = os.path.join(game_dir, "latest.jpg")
    concat_path = concat_images_horizontally_with_text(vis_paths, similarities, match, save_path=archive)

    if concat_path:
        img = cv2.imread(concat_path)
        if img is not None:
            atomic_write(img, round_alias)
            atomic_write(img, latest_alias)

    # 손 상태 요약(디버깅용)
    hand_status = [
        {"L": hand_metas[i]["status"]["L"], "R": hand_metas[i]["status"]["R"]}
        for i in range(len(hand_metas))
    ]

    # 디버깅 참고정보
    hand_visible_sets_detected = [list(visible_detected(m)) for m in hand_metas]
    hand_visible_sets_expected = [list(visible_expected(m)) for m in hand_metas]

    return {
        "ok": True,
        "all_pass": bool(match),
        "scores": similarities,
        "vis_files": [os.path.basename(v) for v in vis_paths],
        "row_file_archive": os.path.basename(archive) if concat_path else None,
        "row_file_round_alias": os.path.basename(round_alias),
        "row_file_latest_alias": os.path.basename(latest_alias),
        "results_url_base": f"/results/{today_dir}/{gameId}/{team}/",  # 날짜 포함
        "hand_status": hand_status,  # present_detected / present_missed / absent_or_uncertain
        "hand_rule": HAND_RULE,
        "hand_rule_ok": hand_rule_ok,
        "hand_rule_reason": hand_rule_reason,
        "hand_visible_sets_detected": hand_visible_sets_detected,
        "hand_visible_sets_expected": hand_visible_sets_expected,
    }

# 정적 서빙
app.mount("/results", StaticFiles(directory=RESULTS_ROOT, check_dir=False), name="results")
# 예: http://<host>:<port>/results/2025-08-11/<gameId>/<team>/round-1.jpg