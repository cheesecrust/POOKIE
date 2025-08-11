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

# 좌우 라벨 정렬을 위해: Left가 먼저, Right가 다음
def _hand_points_and_conf(image_bgr, w, h):
    pts = []
    confs = []
    draw = []

    result = hands.process(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    # 기본적으로 왼손,오른손 순 정렬
    ordered = []
    if getattr(result, "multi_hand_landmarks", None):
        # handedness와 landmarks를 함께 정렬
        labels = []
        if getattr(result, "multi_handedness", None):
            for hd in result.multi_handedness:
                labels.append(hd.classification[0].label)  # "Left" or "Right"
        else:
            labels = ["Unknown"] * len(result.multi_hand_landmarks)

        scores = []
        if getattr(result, "multi_handedness", None):
            for hd in result.multi_handedness:
                scores.append(float(hd.classification[0].score))
        else:
            scores = [0.0] * len(result.multi_hand_landmarks)

        for i, hand in enumerate(result.multi_hand_landmarks):
            ordered.append((labels[i], scores[i], hand))

        # Left 먼저, 그 다음 Right, 그 외
        def _key(t):
            lab = t[0]
            if lab == "Left": return 0
            if lab == "Right": return 1
            return 2
        ordered.sort(key=_key)

        for lab, sc, hand in ordered:
            hp = [[lm.x * w, lm.y * h] for lm in hand.landmark]
            pts.extend(hp)                        # 21점
            confs.extend([sc] * len(hp))         # 한 손 신뢰도 동일 복사
            draw.append(hand)

    # 두 손(42점) 채우기
    while len(pts) < HAND_POINTS_PER_HAND * 2:
        pts.append([-1.0, -1.0])       # sentinel
        confs.append(0.0)

    return np.array(pts, dtype=np.float32), np.array(confs, dtype=np.float32), draw

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
    raw_xy = {}  # 이미지 좌표계에서의 원본 (nose/어깨 계산용)
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

    # Hands XY/Conf (좌/우 순서 강제)
    hand_xy, hand_conf, hand_draw = _hand_points_and_conf(image, w, h)

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

def confidence_distance_2d(p_xy, q_xy, p_conf, q_conf, scheme="max", allow_mirror=True, w_body=0.6, w_hand=0.4):
    pb, ph = _split_xy(p_xy)
    qb, qh = _split_xy(q_xy)

    # 신뢰도 분리
    pc_body = p_conf[:len(POSE_INDEX_LIST)]
    qc_body = q_conf[:len(POSE_INDEX_LIST)]
    pc_hand = p_conf[len(POSE_INDEX_LIST):]
    qc_hand = q_conf[len(POSE_INDEX_LIST):]

    def weight(c1, c2):
        if scheme == "p": return c1
        if scheme == "q": return c2
        if scheme == "avg": return 0.5 * (c1 + c2)
        return np.maximum(c1, c2)  # "max"

    def cd_part(a, b, ca, cb):
        cos_k = _per_keypoint_cos_nd(a, b, dim=2)
        w = weight(ca, cb)
        return float((w * cos_k).sum() / (w.sum() + 1e-6))

    s_body = cd_part(pb, qb, pc_body, qc_body)
    s_hand = cd_part(ph, qh, pc_hand, qc_hand)
    s0 = w_body * s_body + w_hand * s_hand

    if not allow_mirror:
        return s0

    # 좌우 반전 보정
    qb_m = _mirror_xy(qb)
    qh_m = _mirror_xy(qh)
    s_body_m = cd_part(pb, qb_m, pc_body, qc_body)
    s_hand_m = cd_part(ph, qh_m, pc_hand, qc_hand)
    s1 = w_body * s_body_m + w_hand * s_hand_m
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
W_BODY_2D, W_HAND_2D = 0.6, 0.4
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

    def pair_score(i, j):
        s2d = confidence_distance_2d(
            vecs_xy[i], vecs_xy[j], confs[i], confs[j],
            scheme="max", allow_mirror=True, w_body=W_BODY_2D, w_hand=W_HAND_2D
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

    return {
        "ok": True,
        "all_pass": bool(match),
        "scores": similarities,
        "vis_files": [os.path.basename(v) for v in vis_paths],
        "row_file_archive": os.path.basename(archive) if concat_path else None,
        "row_file_round_alias": os.path.basename(round_alias),
        "row_file_latest_alias": os.path.basename(latest_alias),
        "results_url_base": f"/results/{today_dir}/{gameId}/{team}/",  # 날짜 포함
    }

# 정적 서빙
app.mount("/results", StaticFiles(directory=RESULTS_ROOT, check_dir=False), name="results")
# 예: http://<host>:<port>/results/2025-08-11/<gameId>/<team>/round-1.jpg