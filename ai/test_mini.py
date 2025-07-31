import os
import cv2
import numpy as np
import mediapipe as mp
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt

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
    mp_pose.PoseLandmark.LEFT_EYE_OUTER, mp_pose.PoseLandmark.RIGHT_EYE_OUTER
}

# ---------------- CLAHE 전처리 ---------------- #
def preprocess_image(image):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    lab = cv2.merge((cl, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# ---------------- 손 detect ---------------- #
def refine_hand_keypoints(image, pose_result, hand_model, w, h, save_dir="./hand_crops", img_name="debug"):
    os.makedirs(save_dir, exist_ok=True)
    hand_keypoints = []
    hand_landmarks_for_draw = []

    full_result = hand_model.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if full_result.multi_hand_landmarks:
        for i, hand_landmarks in enumerate(full_result.multi_hand_landmarks):
            current_landmarks = []
            for lm in hand_landmarks.landmark:
                x, y = int(lm.x * w), int(lm.y * h)
                current_landmarks.append([x, y])
            hand_keypoints.extend(current_landmarks)
            hand_landmarks_for_draw.append(hand_landmarks)

            annotated = image.copy()
            mp_drawing.draw_landmarks(
                annotated, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_hand_landmarks_style()
            )
            crop_path = os.path.join(save_dir, f"{img_name}_full_hand_{i}.jpg")
            cv2.imwrite(crop_path, annotated)

    while len(hand_keypoints) < 42:
        hand_keypoints.append([0, 0])

    return hand_keypoints, hand_landmarks_for_draw

# ---------------- 관절 벡터 추출 ---------------- #
def extract_normalized_keypoints(image_path, save_vis_dir="./results_landmarks"):
    os.makedirs(save_vis_dir, exist_ok=True)
    image = cv2.imread(image_path)
    if image is None:
        return None
    image = preprocess_image(image)
    h, w, _ = image.shape
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pose_result = pose.process(image_rgb)
    if not pose_result.pose_landmarks:
        return None

    keypoints, labels = [], []
    for idx, lm in enumerate(pose_result.pose_landmarks.landmark):
        if idx not in [lm.value for lm in UPPER_BODY_LANDMARKS]:
            continue
        x, y = lm.x * w, lm.y * h
        keypoints.append([x, y])
        labels.append(str(idx))

    hand_keypoints, hand_landmarks_for_draw = refine_hand_keypoints(image, pose_result, hands, w, h, img_name=os.path.basename(image_path))
    keypoints.extend(hand_keypoints[:42])
    keypoints = np.array(keypoints)

    try:
        nose_idx = labels.index(str(mp_pose.PoseLandmark.NOSE.value))
        nose = keypoints[nose_idx]
    except ValueError:
        nose = keypoints[0] if len(keypoints) > 0 else [0, 0]

    keypoints -= nose
    scale = np.max(keypoints.max(axis=0) - keypoints.min(axis=0))
    if scale == 0:
        return None
    keypoints /= scale

    annotated = image_rgb.copy()
    mp_drawing.draw_landmarks(
        annotated, pose_result.pose_landmarks, mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
    )
    for hl in hand_landmarks_for_draw:
        mp_drawing.draw_landmarks(
            annotated, hl, mp_hands.HAND_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_hand_landmarks_style()
        )

    save_path = os.path.join(save_vis_dir, f"vis_{os.path.basename(image_path)}")
    cv2.imwrite(save_path, cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))
    return keypoints.flatten(), save_path

# ---------------- 제시어 기반 가중치 ---------------- #
def get_weights_by_keyword(image_path: str, keypoint_config: dict):
    for keyword, parts in keypoint_config.items():
        if keyword in image_path.lower():
            w_hand = 1.0 if "hands" in parts else 0.0
            w_pose = 1.0 if "pose" in parts else 0.0
            total = w_hand + w_pose
            return w_pose / total, w_hand / total if total > 0 else (0.5, 0.5)
    return 1.0, 0.0

# ---------------- 좌표 기반 시각화 ---------------- #
def mirror_vector(vec):
    reshaped = vec.reshape(-1, 2)
    reshaped[:,0] *= -1  # 좌우 반전
    return reshaped.flatten()

def visualize_keypoints_comparison(vec1, vec2, title="Comparison", save_path=None):
    v1 = vec1.reshape(-1, 2)
    v2 = vec2.reshape(-1, 2)

    plt.figure(figsize=(6,6))
    plt.scatter(v1[:,0], -v1[:,1], c="blue", label="Image 1", alpha=0.6)
    plt.scatter(v2[:,0], -v2[:,1], c="red", label="Image 2", alpha=0.6)

    for (x1,y1), (x2,y2) in zip(v1, v2):
        plt.plot([x1, x2], [-y1, -y2], "gray", alpha=0.3)

    plt.legend()
    plt.title(title)
    plt.axis("equal")
    if save_path:
        plt.savefig(save_path)
        print(f"✅ 좌표 비교 시각화 저장: {save_path}")
    plt.close()

# ---------------- 유사도 계산 ---------------- #
def weighted_similarity_by_keyword(vecs, image_paths, save_dir, threshold=0.9):
    v1, v2, v3 = [v for v, _ in vecs]
    img1, img2, img3 = image_paths
    v1_pose, v1_hand = v1[:34], v1[34:]
    v2_pose, v2_hand = v2[:34], v2[34:]
    v3_pose, v3_hand = v3[:34], v3[34:]

    w_pose, w_hand = get_weights_by_keyword(img1, KEYPOINT_CONFIG)

    def sim(a_pose, a_hand, b_pose, b_hand):
        pose_sim = cosine_similarity([a_pose], [b_pose])[0][0]
        hand_sim = cosine_similarity([a_hand], [b_hand])[0][0]
        return w_pose * pose_sim + w_hand * hand_sim

    sim12 = sim(v1_pose, v1_hand, v2_pose, v2_hand)
    sim13 = sim(v1_pose, v1_hand, v3_pose, v3_hand)
    sim23 = sim(v2_pose, v2_hand, v3_pose, v3_hand)
    all_pass = sim12 >= threshold and sim13 >= threshold and sim23 >= threshold

    # 좌표 기반 시각화 저장
    visualize_keypoints_comparison(v1, v2, "Image1 vs Image2", os.path.join(save_dir, "compare_1_2.png"))
    visualize_keypoints_comparison(v1, v3, "Image1 vs Image3", os.path.join(save_dir, "compare_1_3.png"))
    visualize_keypoints_comparison(v2, v3, "Image2 vs Image3", os.path.join(save_dir, "compare_2_3.png"))

    return sim12, sim13, sim23, all_pass

# ---------------- Row 이미지 ---------------- #
def concat_images_horizontally_with_text(image_paths, similarities, all_pass, save_path="result_row.jpg"):
    images = [cv2.imread(path) for path in image_paths if cv2.imread(path) is not None]
    if not images:
        return
    h, w = images[0].shape[:2]
    resized = [cv2.resize(img, (w, h)) for img in images]
    concat_img = cv2.hconcat(resized)
    text = f"1-2: {similarities['1-2']:.3f}, 1-3: {similarities['1-3']:.3f}, 2-3: {similarities['2-3']:.3f}"
    status = "✅ Match!" if all_pass else "❌ Not Match!"
    cv2.putText(concat_img, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(concat_img, status, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                (0, 200, 0) if all_pass else (0, 0, 255), 2)
    cv2.imwrite(save_path, concat_img)
    print(f"✅ 이어붙인 이미지 저장 완료: {save_path}")

# ---------------- 실행 ---------------- #
def compare_and_save_from_dir(test_dir="./captured_images", threshold=0.9, save_dir="./results_debug"):
    os.makedirs(save_dir, exist_ok=True)
    image_files = [os.path.join(test_dir, f) for f in os.listdir(test_dir) if f.lower().endswith(('.jpg', '.png'))]
    if len(image_files) < 3:
        return

    img_paths = image_files[:3]
    vecs, vis_paths = [], []
    for path in img_paths:
        result = extract_normalized_keypoints(path, save_vis_dir=save_dir)
        if result is None:
            return
        vec, vis_path = result
        vecs.append((vec, vis_path))
        vis_paths.append(vis_path)

    sim12, sim13, sim23, matched = weighted_similarity_by_keyword(vecs, img_paths, save_dir, threshold)
    similarities = {"1-2": sim12, "1-3": sim13, "2-3": sim23}
    row_path = os.path.join(save_dir, "result_row.jpg")
    concat_images_horizontally_with_text(vis_paths, similarities, matched, save_path=row_path)
    return row_path

if __name__ == "__main__":
    compare_and_save_from_dir(test_dir="./captured_images", threshold=0.6, save_dir="./results_debug")