from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ★ 정적 서빙 추가
from typing import List, Tuple
import os, uuid, datetime, math
import numpy as np
import cv2
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.responses import JSONResponse
import re

RESULTS_ROOT = os.getenv("RESULTS_ROOT", "/app/results_debug")
# 루트 디렉토리 보장
os.makedirs(RESULTS_ROOT, exist_ok=True)

# ---------------- FastAPI 기본 설정 ---------------- #
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://i13a604.p.ssafy.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Mediapipe 초기화 ---------------- #
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
pose = mp_pose.Pose(static_image_mode=True)
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3
)
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# ---------------- 제시어별 가중치 설정 ---------------- #
KEYPOINT_CONFIG = {
    "heart": ["pose", "hands"],
    "gun": ["pose", "hands"],
    "baseball": ["pose"],
    "boxing": ["pose"],
    "basketball": ["pose", "hands"],
    "pretty": ["pose", "hands"]
}

# ---------------- 상체 관절만 추출 ---------------- #
UPPER_BODY_LANDMARKS = {
    mp_pose.PoseLandmark.NOSE,
    mp_pose.PoseLandmark.LEFT_EYE, mp_pose.PoseLandmark.RIGHT_EYE,
    mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.RIGHT_EAR,
    mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
    mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW,
    mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST,
    mp_pose.PoseLandmark.MOUTH_LEFT, mp_pose.PoseLandmark.MOUTH_RIGHT,
    mp_pose.PoseLandmark.LEFT_EYE_INNER, mp_pose.PoseLandmark.RIGHT_EYE_INNER,
    mp_pose.PoseLandmark.LEFT_EYE_OUTER, mp_pose.PoseLandmark.RIGHT_EYE_OUTER,
}

# (추가) 사전 계산으로 가독성/성능 미세 개선
ALLOWED_POSE_IDX = {lm.value for lm in UPPER_BODY_LANDMARKS}

# ---------------- CLAHE 전처리 ---------------- #
def preprocess_image(image):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    lab = cv2.merge((cl, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# ---------------- 손 키포인트 추출 ---------------- #
def refine_hand_keypoints(image, hand_model, w, h):
    hand_keypoints = []
    hand_landmarks_for_draw = []

    result = hand_model.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            current_landmarks = []
            for lm in hand_landmarks.landmark:
                current_landmarks.append([lm.x * w, lm.y * h])
            hand_keypoints.extend(current_landmarks)
            hand_landmarks_for_draw.append(hand_landmarks)

    while len(hand_keypoints) < 42:
        hand_keypoints.append([0, 0])

    return hand_keypoints, hand_landmarks_for_draw

# ★ 팔/어깨 특징 벡터 계산 (각도/거리 기반, 스케일/평행이동 불변)
def _angle(a, b, c):
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    nba = ba / (np.linalg.norm(ba) + 1e-6)
    nbc = bc / (np.linalg.norm(bc) + 1e-6)
    cosang = np.clip(np.dot(nba, nbc), -1.0, 1.0)
    return math.acos(cosang)  # [0, pi]

def _arm_features(raw_points, scale):
    LS = mp_pose.PoseLandmark.LEFT_SHOULDER.value
    RS = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    LE = mp_pose.PoseLandmark.LEFT_ELBOW.value
    RE = mp_pose.PoseLandmark.RIGHT_ELBOW.value
    LW = mp_pose.PoseLandmark.LEFT_WRIST.value
    RW = mp_pose.PoseLandmark.RIGHT_WRIST.value

    # 필요한 포인트가 모두 있어야 함
    need = [LS, RS, LE, RE, LW, RW]
    if any(i not in raw_points for i in need):
        return None

    l_shoulder = raw_points[LS]; r_shoulder = raw_points[RS]
    l_elbow = raw_points[LE];    r_elbow = raw_points[RE]
    l_wrist = raw_points[LW];    r_wrist = raw_points[RW]

    left_elbow_ang  = _angle(l_shoulder, l_elbow, l_wrist) / math.pi
    right_elbow_ang = _angle(r_shoulder, r_elbow, r_wrist) / math.pi

    shoulder_width = np.linalg.norm(np.array(l_shoulder) - np.array(r_shoulder)) / (scale + 1e-6)
    lw_sh_dist = np.linalg.norm(np.array(l_wrist) - np.array(l_shoulder)) / (scale + 1e-6)
    rw_sh_dist = np.linalg.norm(np.array(r_wrist) - np.array(r_shoulder)) / (scale + 1e-6)

    return np.array([left_elbow_ang, right_elbow_ang, shoulder_width, lw_sh_dist, rw_sh_dist], dtype=np.float32)

# ---------------- 관절 벡터 추출 ---------------- #
def extract_normalized_keypoints(image_bytes, filename, save_vis_dir="./results_landmarks"):
    os.makedirs(save_vis_dir, exist_ok=True)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return None, None, None
    image = preprocess_image(image)
    h, w, _ = image.shape

    pose_result = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if not pose_result.pose_landmarks:
        return None, None, None

    keypoints = []
    labels = []
    raw_points = {}  # ★ 원본 좌표 보관(각도/거리 계산용)

    for idx, lm in enumerate(pose_result.pose_landmarks.landmark):
        if idx not in ALLOWED_POSE_IDX:
            continue
        x, y = lm.x * w, lm.y * h
        keypoints.append([x, y])
        labels.append(str(idx))
        raw_points[idx] = [x, y]

    hand_keypoints, hand_landmarks_for_draw = refine_hand_keypoints(image, hands, w, h)
    keypoints.extend(hand_keypoints)

    keypoints = np.array(keypoints)
    try:
        nose_idx = labels.index(str(mp_pose.PoseLandmark.NOSE.value))
        nose = keypoints[nose_idx]
    except ValueError:
        nose = keypoints[0] if len(keypoints) > 0 else [0, 0]

    keypoints -= nose
    scale = np.max(keypoints.max(axis=0) - keypoints.min(axis=0))
    if scale == 0:
        return None, None, None
    keypoints /= scale

    # ★ 팔/어깨 특징 벡터 생성
    arm_feat = _arm_features(raw_points, scale)
    if arm_feat is None:
        arm_feat = np.zeros(5, dtype=np.float32)

    # 시각화 저장
    annotated = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_drawing.draw_landmarks(
        annotated, pose_result.pose_landmarks, mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
    )
    for hl in hand_landmarks_for_draw:
        mp_drawing.draw_landmarks(
            annotated, hl, mp_hands.HAND_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_hand_landmarks_style()
        )

    vis_path = os.path.join(save_vis_dir, f"vis_{filename}")
    cv2.imwrite(vis_path, cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))
    return keypoints.flatten(), vis_path, arm_feat  # ★ arm_feat 추가 반환

# ---------------- 제시어 기반 가중치 ---------------- #
def get_weights_by_keyword(filename: str):
    for keyword, parts in KEYPOINT_CONFIG.items():
        if keyword in filename.lower():
            w_hand = 1.0 if "hands" in parts else 0.0
            w_pose = 1.0 if "pose" in parts else 0.0
            total = w_hand + w_pose
            return (w_pose / total, w_hand / total) if total > 0 else (0.5, 0.5)
    return 1.0, 0.0

POSE_DIMS = len(ALLOWED_POSE_IDX) * 2   # 21 * 2 = 42
HAND_DIMS = 42 * 2                      # 42 points * (x,y) = 84

# ---------------- 유사도 계산 ---------------- #
def weighted_similarity(v1, v2, w_pose, w_hand):
    v1_pose = v1[:POSE_DIMS]
    v1_hand = v1[POSE_DIMS:POSE_DIMS + HAND_DIMS]
    v2_pose = v2[:POSE_DIMS]
    v2_hand = v2[POSE_DIMS:POSE_DIMS + HAND_DIMS]
    pose_sim = cosine_similarity([v1_pose], [v2_pose])[0][0]
    hand_sim = cosine_similarity([v1_hand], [v2_hand])[0][0]
    return w_pose * pose_sim + w_hand * hand_sim

# ---------------- 이미지 tmp 처리 ---------------- #
def atomic_write(image_bgr, target_path: str):
    tmp = target_path + ".tmp"
    cv2.imwrite(tmp, image_bgr)
    os.replace(tmp, target_path)

# ---------------- Row 이미지 생성 ---------------- #
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

def _slug(s, default):
    s = (s or default).strip().lower()
    return re.sub(r'[^a-z0-9._-]+','-', s) or default

# ---------------- FastAPI 엔드포인트 ---------------- #

# ★ 튜닝 파라미터
ANGLE_BLEND = 0.30   # 팔/어깨 특징 유사도 비중
PASS_THRESHOLD = 0.90  # 최종 통과 임계값(기존 0.6→0.9 로 상향)


@app.post("/ai/upload_images")
async def upload_images(
    images: List[UploadFile] = File(...),
    gameId: str | None = Query(default="unknown-game"),
    team: str | None = Query(default="unknown-team"),
    round: int | None = Query(default=1)
):
    if len(images) != 3:
        return {"status": "error", "message": "정확히 3장의 이미지를 업로드해야 합니다."}

    vecs, vis_paths, names, arm_feats = [], [], [], []
    gameId = _slug(gameId, "unknown-game")
    team   = _slug(team, "unknown-team")
    round_num  = int(round or 1)

    # 하위 디렉토리 보장
    game_dir = os.path.join(RESULTS_ROOT, gameId, team)
    os.makedirs(game_dir, exist_ok=True)

    for file in images:
        contents = await file.read()
        names.append(file.filename)
        vec, vis_path, arm_feat = extract_normalized_keypoints(contents, file.filename, save_vis_dir=game_dir)
        if vec is None:
            return {"status":"error","message":f"관절 추출 실패: {file.filename}"}
        vecs.append(vec)
        vis_paths.append(vis_path)
        arm_feats.append(arm_feat)

    # ✅ 가중치 계산
    w_pose, w_hand = get_weights_by_keyword(names[0])

    # 좌표 기반(포즈+손) 유사도
    sim12 = float(weighted_similarity(vecs[0], vecs[1], w_pose, w_hand))
    sim13 = float(weighted_similarity(vecs[0], vecs[2], w_pose, w_hand))
    sim23 = float(weighted_similarity(vecs[1], vecs[2], w_pose, w_hand))

    # ★ 팔/어깨 특징 유사도(코사인)
    a12 = float(cosine_similarity([arm_feats[0]], [arm_feats[1]])[0][0])
    a13 = float(cosine_similarity([arm_feats[0]], [arm_feats[2]])[0][0])
    a23 = float(cosine_similarity([arm_feats[1]], [arm_feats[2]])[0][0])

    # ★ 최종 유사도 = (좌표 기반)*(1-ANGLE_BLEND) + (팔/어깨 특징)*ANGLE_BLEND
    f12 = (1-ANGLE_BLEND)*sim12 + ANGLE_BLEND*a12
    f13 = (1-ANGLE_BLEND)*sim13 + ANGLE_BLEND*a13
    f23 = (1-ANGLE_BLEND)*sim23 + ANGLE_BLEND*a23

    all_pass = bool(f12 >= PASS_THRESHOLD and f13 >= PASS_THRESHOLD and f23 >= PASS_THRESHOLD)
    similarities = {"1-2": round(f12,3), "1-3": round(f13,3), "2-3": round(f23,3)}

    # 아카이브 파일명(절대 덮어쓰기 안 됨) + 라운드/최신 별칭
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(game_dir, f"r{round_num}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
    round_alias = os.path.join(game_dir, f"round-{round_num}.jpg")
    latest_alias = os.path.join(game_dir, "latest.jpg")

    # Row 이미지 생성 → 아카이브로 저장
    concat_path = concat_images_horizontally_with_text(vis_paths, similarities, all_pass, save_path=archive)

    # 별칭(바로보기) 원자적 교체
    if concat_path:
        img = cv2.imread(concat_path)
        if img is not None:
            atomic_write(img, round_alias)
            atomic_write(img, latest_alias)

    return {
        "status": "ok",
        "vis_files": [os.path.basename(v) for v in vis_paths],
        "row_file_archive": os.path.basename(archive) if concat_path else None,
        "row_file_round_alias": os.path.basename(round_alias),
        "row_file_latest_alias": os.path.basename(latest_alias),
        "similarities": similarities,
        "all_pass": all_pass,
        "save_dir": f"/results/{gameId}/{team}/"
    }

# ★ 결과 폴더 정적 서빙 (브라우저에서 바로 확인)
app.mount("/results", StaticFiles(directory=RESULTS_ROOT, check_dir=False), name="results")
# 예: http://<도메인>:8001/results/<gameId>/<team>/round-1.jpg