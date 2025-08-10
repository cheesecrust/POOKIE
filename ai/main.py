from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ★ 정적 서빙 추가
from typing import List, Tuple
import os, uuid, datetime
import numpy as np
import cv2
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity

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

# ---------------- 관절 벡터 추출 ---------------- #
def extract_normalized_keypoints(image_bytes, filename, save_vis_dir="./results_landmarks"):
    os.makedirs(save_vis_dir, exist_ok=True)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return None, None
    image = preprocess_image(image)
    h, w, _ = image.shape

    pose_result = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if not pose_result.pose_landmarks:
        return None, None

    keypoints = []
    labels = []
    for idx, lm in enumerate(pose_result.pose_landmarks.landmark):
        if idx not in [lm.value for lm in UPPER_BODY_LANDMARKS]:
            continue
        keypoints.append([lm.x * w, lm.y * h])
        labels.append(str(idx))

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
        return None, None
    keypoints /= scale

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
    return keypoints.flatten(), vis_path

# ---------------- 제시어 기반 가중치 ---------------- #
def get_weights_by_keyword(filename: str):
    for keyword, parts in KEYPOINT_CONFIG.items():
        if keyword in filename.lower():
            w_hand = 1.0 if "hands" in parts else 0.0
            w_pose = 1.0 if "pose" in parts else 0.0
            total = w_hand + w_pose
            return w_pose / total, w_hand / total if total > 0 else (0.5, 0.5)
    return 1.0, 0.0

# ---------------- 유사도 계산 ---------------- #
def weighted_similarity(v1, v2, w_pose, w_hand):
    v1_pose, v1_hand = v1[:34], v1[34:]
    v2_pose, v2_hand = v2[:34], v2[34:]
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
    images = [cv2.imread(path) for path in image_paths if cv2.imread(path) is not None]
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
    # ★ 원자적 저장으로 변경(동시 접근 시 파일 깨짐 방지)
    atomic_write(concat_img, save_path)
    return save_path

# ---------------- FastAPI 엔드포인트 ---------------- #
RESULTS_ROOT = "./results_debug"
os.makedirs(RESULTS_ROOT, exist_ok=True)

@app.post("/ai/upload_images")
async def upload_images(
    images: List[UploadFile] = File(...),
    gameId: str | None = Query(default="unknown-game"),
    team: str | None = Query(default="unknown-team"),
    round: int | None = Query(default=1)
):
    if len(images) != 3:
        return {"status": "error", "message": "정확히 3장의 이미지를 업로드해야 합니다."}

    vecs, vis_paths, names = [], [], []
    gameId = gameId or "unknown-game"
    team = (team or "unknown-team").lower()
    round = int(round or 1)

    game_dir = os.path.join(RESULTS_ROOT, gameId, team)
    os.makedirs(game_dir, exist_ok=True)

    for file in images:
        contents = await file.read()  # 원본 파일 저장 안 함
        names.append(file.filename)
        vec, vis_path = extract_normalized_keypoints(contents, file.filename, save_vis_dir=game_dir)
        if vec is None:
            return {"status":"error","message":f"관절 추출 실패: {file.filename}"}
        vecs.append(vec)
        vis_paths.append(vis_path)

    # 가중치 계산 
    w_pose, w_hand = get_weights_by_keyword(names[0])

    sim12 = float(weighted_similarity(vecs[0], vecs[1], w_pose, w_hand))
    sim13 = float(weighted_similarity(vecs[0], vecs[2], w_pose, w_hand))
    sim23 = float(weighted_similarity(vecs[1], vecs[2], w_pose, w_hand))
    all_pass = bool(sim12 >= 0.6 and sim13 >= 0.6 and sim23 >= 0.6)
    similarities = {"1-2": round(sim12,3), "1-3": round(sim13,3), "2-3": round(sim23,3)}

    # 아카이브 파일명(절대 덮어쓰기 안 됨) + 라운드/최신 별칭
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(game_dir, f"r{round}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
    round_alias = os.path.join(game_dir, f"round-{round}.jpg")
    latest_alias = os.path.join(game_dir, "latest.jpg")

    # row 이미지 생성 → 아카이브로 저장
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
        "save_dir": f"results_debug/{gameId}/{team}/"
    }

# 결과 폴더 정적 서빙 (브라우저에서 바로 확인)
app.mount("/results", StaticFiles(directory="results_debug"), name="results")
# 예: http://<도메인>:8001/results/<gameId>/<team>/round-1.jpg