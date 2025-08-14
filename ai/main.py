"""
main.py — 공통-samepose (일심동체) 서버 통합 패치본

핵심 변화
- 얼굴(코/눈/입/귀) 완전 제외 → 어깨·팔꿈치·손목만 사용
- 정렬/스케일 기준을 '코' → '양 어깨 중점'으로 변경 (코 가림에도 안정)
- 손 라벨(Left/Right) 우선 배정 + ROI는 보정용
- 손 유사도: 2D Procrustes(회전/스케일 정렬) 후 가중 코사인
- 몸 유사도: 3D Kabsch + (옵션) 팔의 뼈대 각도 유사도 보강
- 원근 차 감지 시 3D 비중 자동 상향 (DEPTH_BLEND 동적)
- 손 가중치 동적 확대 + 최소 가중 하한(HAND_WEIGHT_FLOOR)로 항상 반영
- '몸이 약할 때 손-only'는 제거 → 항상 손/몸 혼합

엔드포인트
- POST /ai/upload_images  : 3장의 이미지 업로드/판정
- GET  /results/...        : 시각화 이미지 정적 서빙
"""

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

# Pose를 조금 더 관용적으로 (팔/관절 잡힘 개선)
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=2,             # 1→2로 올리면 팔/관절 검출 안정성↑
    enable_segmentation=False,
    min_detection_confidence=0.35,  # 화질/가림에 좀 더 관대
    min_tracking_confidence=0.30
)

hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.50,
    min_tracking_confidence=0.30
)

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


# ================== 상반신 랜드마크 (얼굴 제외) ==================
UPPER_BODY_LANDMARKS = {
    mp_pose.PoseLandmark.LEFT_SHOULDER,
    mp_pose.PoseLandmark.RIGHT_SHOULDER,
    mp_pose.PoseLandmark.LEFT_ELBOW,
    mp_pose.PoseLandmark.RIGHT_ELBOW,
    mp_pose.PoseLandmark.LEFT_WRIST,
    mp_pose.PoseLandmark.RIGHT_WRIST,
}
ALLOWED_POSE_IDX = {lm.value for lm in UPPER_BODY_LANDMARKS}
POSE_INDEX_LIST = sorted(ALLOWED_POSE_IDX)  # 순서 고정

POSE_DIMS = len(POSE_INDEX_LIST) * 2
HAND_POINTS_PER_HAND = 21
HAND_DIMS = HAND_POINTS_PER_HAND * 2 * 2  # 84 (좌/우 2손 × 21포인트 × xy)

# ================== 손 판정/ROI 튜닝 파라미터 ==================
HAND_VIS_TH  = 0.45
ROI_ALPHA    = 0.45
ROI_SIZE_B   = 1.4
ROI_COVER_TH = 0.50
NEAR_TH_MULT = 0.8

# ==== 하이퍼파라미터 / 토글 ====
USE_3D = True                  # 3D world가 있을 때 3D 점수 블렌딩
DEPTH_BLEND = 0.35             # 원근 감지되면 동적 상향

PASS_THRESHOLD = 0.55          # 0.52~0.60 튜닝
PASS_POLICY    = "all"         # all | majority | ref

# 2D 기본 가중 (동적 모드에서 덮어씌움)
W_BODY_2D, W_HAND_2D = 0.55, 0.45

SCHEME_BODY_2D = "CD_max"      # {"CD_p","CD_q","CD_avg","CD_max"}
SCHEME_HAND_2D = "CD_max"

# 손 비중 동적 조절 + 하한(몸이 좋아도 손은 항상 반영)
USE_DYNAMIC_HAND_WEIGHT = True
HAND_WEIGHT_MIN   = 0.50
HAND_WEIGHT_MAX   = 0.90
HAND_WEIGHT_FLOOR = 0.40       # 손의 최소 기여(0.35~0.50 권장)
CONF_TH = 0.40                 # 키포인트 신뢰도 임계치

# 3D 정렬(팔 위주) 인덱스
ALIGN_IDX = []
for lm in [mp_pose.PoseLandmark.LEFT_SHOULDER.value,
           mp_pose.PoseLandmark.RIGHT_SHOULDER.value,
           mp_pose.PoseLandmark.LEFT_ELBOW.value,
           mp_pose.PoseLandmark.RIGHT_ELBOW.value,
           mp_pose.PoseLandmark.LEFT_WRIST.value,
           mp_pose.PoseLandmark.RIGHT_WRIST.value]:
    if lm in POSE_INDEX_LIST:
        ALIGN_IDX.append(POSE_INDEX_LIST.index(lm))

# ================== 유틸 ==================
def preprocess_image(image_bgr: np.ndarray) -> np.ndarray:
    """조명/대비 안정화를 위한 약한 CLAHE 전처리"""
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)

def _slug(s, default):
    s = (s or default).strip().lower()
    return re.sub(r'[^a-z0-9._-]+', '-', s) or default

def atomic_write(image_bgr, target_path: str):
    """임시 파일로 쓰고 원자적 교체(중간깨짐 방지)"""
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

# ================== 손 라벨 우선 배정 + ROI 보정 ==================
def _hand_points_and_conf(image_bgr, w, h, wrists=None, elbows=None, vis=None):
    """Hands를 돌려 좌/우 손 좌표/신뢰도를 반환.
    - multi_handedness 라벨 우선 배정(보이면 present_detected)
    - ROI는 라벨 실패 시 보정용
    - 손 신뢰도는 최소 0.5로 clip (2D 손 점수의 영향력 확보)
    """
    pts, confs = [], []
    result = hands.process(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    detected = []
    if getattr(result, "multi_hand_landmarks", None):
        for i, hand in enumerate(result.multi_hand_landmarks):
            cx, cy = _hand_centroid(hand, w, h)
            score, label = 0.0, None
            if getattr(result, "multi_handedness", None):
                md = result.multi_handedness[i].classification[0]
                score, label = float(md.score), md.label  # "Left"/"Right"
            detected.append({"centroid": (cx, cy), "score": score, "lms": hand, "label": label})

    status = {"L": "absent_or_uncertain", "R": "absent_or_uncertain"}
    rois   = {}
    assigned_idx, used_ids = {"L": None, "R": None}, set()

    def make_roi(side):
        if wrists is None or elbows is None: return None, 0.0, 0.0
        w_pt = np.array(wrists[side], dtype=np.float32)
        e_pt = np.array(elbows[side], dtype=np.float32)
        fore_len = float(np.linalg.norm(w_pt - e_pt))
        if fore_len < 5.0: return None, 0.0, fore_len
        dir_vec = (w_pt - e_pt); n = np.linalg.norm(dir_vec)
        if n > 1e-6: dir_vec = dir_vec / n
        c = w_pt + ROI_ALPHA * fore_len * dir_vec
        half = 0.5 * ROI_SIZE_B * fore_len
        box = (c[0]-half, c[1]-half, c[0]+half, c[1]+half)
        cover = _box_cover_ratio(box, w, h)
        return box, cover, fore_len

    for s in ("L","R"):
        roi, cover, fl = make_roi(s)
        rois[s] = {"box": roi, "cover": cover, "fore_len": fl}

    # 1) 라벨 우선 배정
    for side_char, label_text in (("L","Left"), ("R","Right")):
        best_i, best_score = None, -1.0
        for i, d in enumerate(detected):
            if i in used_ids: continue
            if d["label"] == label_text and d["score"] > best_score:
                best_i, best_score = i, d["score"]
        if best_i is not None:
            used_ids.add(best_i)
            assigned_idx[side_char] = best_i
            status[side_char] = "present_detected"

    # 2) ROI 보정 배정
    for side_char in ("L","R"):
        if assigned_idx[side_char] is not None: continue
        bx = rois[side_char]["box"]
        if detected and bx is not None:
            cx, cy = (bx[0]+bx[2])/2, (bx[1]+bx[3])/2
            best_i, best_d = None, 1e9
            for i, d in enumerate(detected):
                if i in used_ids: continue
                dist = math.hypot(d["centroid"][0]-cx, d["centroid"][1]-cy)
                if dist < best_d: best_i, best_d = i, dist
            if best_i is not None:
                used_ids.add(best_i)
                assigned_idx[side_char] = best_i
                status[side_char] = "present_detected"

    # 3) 좌우 채우기
    draws = []
    for side_char in ("L","R"):
        idx = assigned_idx[side_char]
        if idx is not None:
            hand = detected[idx]
            hp = [[lm.x*w, lm.y*h] for lm in hand["lms"].landmark]
            pts.extend(hp)
            confs.extend([max(0.5, hand["score"])]*len(hp))  # 손 신뢰도 최소 0.5
            draws.append(hand["lms"])
        else:
            pts.extend([[-1.0, -1.0]]*HAND_POINTS_PER_HAND)
            confs.extend([0.0]*HAND_POINTS_PER_HAND)

    return (np.array(pts, np.float32),
            np.array(confs, np.float32),
            draws,
            {"status": status, "rois": rois, "vis": dict(vis or {})})

# ================== “idle(아무 포즈도 안함)” 판정 (선택적으로 사용) ==================
def _is_idle_pose(hand_meta, vis_dict):
    """둘 중 어느 손도 present_detected가 아니면 idle로 간주"""
    detected = [s for s, st in hand_meta["status"].items() if st == "present_detected"]
    return len(detected) == 0

NEG_FILTER_REQUIRE = "majority"  # "all" | "majority" | "any"

# ================== 벡터/신뢰도 추출 ==================
def _l2_normalize_per_point(v_flat: np.ndarray, dim: int) -> np.ndarray:
    V = v_flat.reshape(-1, dim).astype(np.float32)
    n = np.linalg.norm(V, axis=1, keepdims=True)
    V = V / (n + 1e-6)
    return V.reshape(-1)

def _cd_weight(p_scores: np.ndarray, q_scores: np.ndarray, scheme: str) -> np.ndarray:
    if scheme == "CD_p":   return p_scores
    if scheme == "CD_q":   return q_scores
    if scheme == "CD_avg": return 0.5 * (p_scores + q_scores)
    if scheme == "CD_max": return np.maximum(p_scores, q_scores)
    raise ValueError("scheme must be one of {'CD_p','CD_q','CD_avg','CD_max'}")

def _split_xy(v_flat: np.ndarray):
    body = v_flat[:POSE_DIMS]
    hand = v_flat[POSE_DIMS:POSE_DIMS + HAND_DIMS]
    return body, hand

# ---------- 2D Procrustes(손 회전/스케일 보정) ----------
def _kabsch_2d(P, Q):
    # P,Q: (N,2)
    Pc = P - P.mean(0, keepdims=True); Qc = Q - Q.mean(0, keepdims=True)
    H = Qc.T @ Pc
    U, S, Vt = np.linalg.svd(H)
    R = U @ Vt
    if np.linalg.det(R) < 0:
        U[:, -1] *= -1; R = U @ Vt
    scale = (S.sum() / (Qc**2).sum())
    return R.astype(np.float32), float(scale), P.mean(0), Q.mean(0)

def _procrustes_align_2d(P_full, Q_full, mask=None):
    if mask is None or not np.any(mask): return Q_full
    R, s, pm, qm = _kabsch_2d(P_full[mask], Q_full[mask])
    return ((Q_full - qm) @ R.T) * s + pm

# ---------- 3D Kabsch ----------
def kabsch_3d(P: np.ndarray, Q: np.ndarray):
    # P,Q: (N,3)
    Pc = P - P.mean(axis=0, keepdims=True)
    Qc = Q - Q.mean(axis=0, keepdims=True)
    H = Qc.T @ Pc
    U, S, Vt = np.linalg.svd(H)
    R = U @ Vt
    if np.linalg.det(R) < 0:
        U[:, -1] *= -1
        R = U @ Vt
    scale = (S.sum() / (Qc**2).sum())
    return R.astype(np.float32), float(scale)

# ---------- 3D 뼈대 각도 유사도 ----------
def _bone_dirs_3d(P):
    LSH = mp_pose.PoseLandmark.LEFT_SHOULDER.value
    RSH = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    LE  = mp_pose.PoseLandmark.LEFT_ELBOW.value
    RE  = mp_pose.PoseLandmark.RIGHT_ELBOW.value
    LW  = mp_pose.PoseLandmark.LEFT_WRIST.value
    RW  = mp_pose.PoseLandmark.RIGHT_WRIST.value
    def u(a,b):
        v = b - a; n = np.linalg.norm(v) + 1e-6
        return v / n
    return np.stack([u(P[LSH],P[LE]), u(P[LE],P[LW]),
                     u(P[RSH],P[RE]), u(P[RE],P[RW])], axis=0)

def bone_angle_similarity_3d(p_xyz_flat, q_xyz_flat, align_idx=None):
    P = p_xyz_flat.reshape(-1,3).astype(np.float32)
    Q = q_xyz_flat.reshape(-1,3).astype(np.float32)
    if align_idx is None: align_idx = list(range(len(P)))
    R, s = kabsch_3d(P[align_idx], Q[align_idx])
    Qa = (Q @ R.T) * s
    vp, vq = _bone_dirs_3d(P), _bone_dirs_3d(Qa)
    s0 = float((vp * vq).sum(axis=1).mean())

    Qm = Q.copy(); Qm[:,0] *= -1
    Rm, sm = kabsch_3d(P[align_idx], Qm[align_idx])
    Qma = (Qm @ Rm.T) * sm
    vqm = _bone_dirs_3d(Qma)
    s1 = float((vp * vqm).sum(axis=1).mean())
    return max(s0, s1)

# ---------- 깊이(원근) 차이 감지 → 3D 비중 상향 ----------
def _pair_depth_blend(meta_i, meta_j, base=DEPTH_BLEND):
    vals_i = [meta_i["rois"][s]["fore_len"] for s in ("L","R") if meta_i["rois"][s]["fore_len"] > 0]
    vals_j = [meta_j["rois"][s]["fore_len"] for s in ("L","R") if meta_j["rois"][s]["fore_len"] > 0]
    if not vals_i or not vals_j: return base
    fi, fj = float(np.mean(vals_i)), float(np.mean(vals_j))
    diff = abs(fi - fj) / max(fi, fj)  # 0~1
    return float(min(0.85, base + 0.45 * diff))

# ---------- 손/몸 동적 가중 (손 하한 보장) ----------
def _expected_hand_set(meta):
    return {s for s, st in meta["status"].items()
            if st in ("present_detected", "present_missed")}

def _adaptive_whand_wbody(p_conf: np.ndarray, q_conf: np.ndarray,
                          meta_i: dict, meta_j: dict,
                          beta_min: float = HAND_WEIGHT_MIN,
                          beta_max: float = HAND_WEIGHT_MAX,
                          conf_th: float = CONF_TH):
    n_body = len(POSE_INDEX_LIST)
    pc_body = p_conf[:n_body]; qc_body = q_conf[:n_body]
    pc_hand = p_conf[n_body:]; qc_hand = q_conf[n_body:]

    body_q = float(np.mean(np.maximum(pc_body, qc_body)))

    def side_quality(start):
        p = pc_hand[start:start+21]; q = qc_hand[start:start+21]
        m = np.minimum(p, q); mask = (m >= conf_th)
        return float(np.mean(m[mask])) if np.any(mask) else 0.0

    use_sides = sorted(_expected_hand_set(meta_i) & _expected_hand_set(meta_j))
    hand_q_list = []
    if "L" in use_sides: hand_q_list.append(side_quality(0))
    if "R" in use_sides: hand_q_list.append(side_quality(21))
    hand_q = float(np.mean(hand_q_list)) if hand_q_list else 0.0

    denom = hand_q + body_q
    alpha = (hand_q / denom) if denom > 1e-6 else 0.0

    # 손 우대 + 몸 약하면 가속
    alpha_bias = 0.12
    if body_q < 0.25:
        alpha_bias += 0.15
    alpha = max(0.0, min(1.0, alpha + alpha_bias))

    beta  = beta_min + (beta_max - beta_min) * alpha
    beta  = max(beta, HAND_WEIGHT_FLOOR)     # 최소 손 가중 보장
    beta  = min(1.0, max(0.0, beta))

    w_hand = beta
    w_body = 1.0 - beta
    return w_body, w_hand

# ---------- 2D 본체(몸/손 분리, Procrustes, 미러 지원) ----------
def confidence_distance_cd2d(
    p_xy, q_xy, p_conf, q_conf,
    scheme_body="CD_max", scheme_hand="CD_max",
    allow_mirror=True, w_body=0.6, w_hand=0.4, use_hand=True
):
    pb, ph = _split_xy(p_xy); qb, qh = _split_xy(q_xy)
    pc_body = p_conf[:len(POSE_INDEX_LIST)]; qc_body = q_conf[:len(POSE_INDEX_LIST)]
    pc_hand = p_conf[len(POSE_INDEX_LIST):]; qc_hand = q_conf[len(POSE_INDEX_LIST):]

    # 몸 점수
    pb_n = _l2_normalize_per_point(pb, 2); qb_n = _l2_normalize_per_point(qb, 2)
    cos_body = (pb_n.reshape(-1,2) * qb_n.reshape(-1,2)).sum(axis=1)
    w_b = _cd_weight(pc_body, qc_body, scheme_body)
    s_body = float((w_b * cos_body).sum() / (float(w_b.sum()) + 1e-6))

    # 손 점수 (Procrustes 정렬 포함)
    s_hand = None
    if use_hand:
        def hand_block(pf, qf, ps, qs):
            P = pf.reshape(-1,2); Q = qf.reshape(-1,2)
            mask = (np.minimum(ps, qs) >= CONF_TH)
            if np.sum(mask) >= 5:
                Q = _procrustes_align_2d(P, Q, mask)
            p_n = _l2_normalize_per_point(P.reshape(-1), 2)
            q_n = _l2_normalize_per_point(Q.reshape(-1), 2)
            cos = (p_n.reshape(-1,2) * q_n.reshape(-1,2)).sum(axis=1)
            w = _cd_weight(ps, qs, scheme_hand); ws = float(w.sum())
            return ((float((w*cos).sum()/(ws+1e-6)), ws) if ws>1e-6 else (None, 0.0))

        pL, pR = ph[:42], ph[42:84]; qL, qR = qh[:42], qh[42:84]
        sL, wL = hand_block(pL, qL, pc_hand[:21], qc_hand[:21])
        sR, wR = hand_block(pR, qR, pc_hand[21:42], qc_hand[21:42])
        bag = [(sL,wL),(sR,wR)]
        bag = [(s,w) for s,w in bag if s is not None]
        if bag:
            s_hand = float(np.average([s for s,_ in bag], weights=[w for _,w in bag]))

    if not allow_mirror:
        return s_body if s_hand is None else (w_body*s_body + w_hand*s_hand)/(w_body + w_hand + 1e-6)

    # 미러 비교
    qb_m = _mirror_xy(qb); qh_m = _mirror_xy(qh)
    qb_n_m = _l2_normalize_per_point(qb_m, 2)
    cos_body_m = (pb_n.reshape(-1,2) * qb_n_m.reshape(-1,2)).sum(axis=1)
    s_body_m = float((w_b * cos_body_m).sum() / (float(w_b.sum()) + 1e-6))

    s_hand_m = None
    if use_hand:
        qLm, qRm = qh_m[:42], qh_m[42:84]
        sL_m, wL_m = hand_block(pL, qLm, pc_hand[:21], qc_hand[:21])
        sR_m, wR_m = hand_block(pR, qRm, pc_hand[21:42], qc_hand[21:42])
        bagm = [(sL_m,wL_m),(sR_m,wR_m)]
        bagm = [(s,w) for s,w in bagm if s is not None]
        if bagm:
            s_hand_m = float(np.average([s for s,_ in bagm], weights=[w for _,w in bagm]))

    mix0 = s_body if s_hand is None else (w_body*s_body + w_hand*s_hand)/(w_body + w_hand + 1e-6)
    mix1 = s_body_m if s_hand_m is None else (w_body*s_body_m + w_hand*s_hand_m)/(w_body + w_hand + 1e-6)
    return max(mix0, mix1)

# ---------- 3D 정렬 + 가중 코사인 ----------
def confidence_distance_cd3d_aligned(
    p_xyz_flat, q_xyz_flat, p_conf_body, q_conf_body,
    scheme="CD_max", allow_mirror=True, align_idx=None
):
    P = p_xyz_flat.reshape(-1,3).astype(np.float32)
    Q = q_xyz_flat.reshape(-1,3).astype(np.float32)
    if align_idx is None:
        align_idx = list(range(len(P)))

    # 원본 정렬
    R, s = kabsch_3d(P[align_idx], Q[align_idx])
    Qa = (Q @ R.T) * s

    pn = _l2_normalize_per_point(P.reshape(-1), 3).reshape(-1,3)
    qn = _l2_normalize_per_point(Qa.reshape(-1), 3).reshape(-1,3)
    w = _cd_weight(p_conf_body, q_conf_body, scheme)
    cos0 = (pn * qn).sum(axis=1)
    s0 = float((w * cos0).sum() / (w.sum() + 1e-6))

    if not allow_mirror:
        return s0

    # 미러 정렬
    Qm = Q.copy(); Qm[:,0] *= -1
    Rm, sm = kabsch_3d(P[align_idx], Qm[align_idx])
    Qma = (Qm @ Rm.T) * sm
    qnm = _l2_normalize_per_point(Qma.reshape(-1), 3).reshape(-1,3)
    cosm = (pn * qnm).sum(axis=1)
    s1 = float((w * cosm).sum() / (w.sum() + 1e-6))

    return max(s0, s1)

# ---------- 벡터 추출(여기 완전체) ----------
def extract_upper_body_vectors(image_bytes: bytes, filename: str, save_dir: str, save_prefix: str = ""):
    """
    입력 이미지에서:
    - 어깨/팔꿈치/손목(얼굴 제외) + Hands 21×2 손 포인트 추출
    - 기준점: 양 어깨 중점 → 평행이동, 어깨 벡터 수평 회전, 어깨폭 스케일 정규화
    - 손 누락 포인트는 (0,0)으로 보정 (center 기준)
    - 3D z도 어깨폭으로 스케일링
    - 시각화 이미지 저장
    """
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

    # --- 포즈 좌표/신뢰도 수집 (얼굴 제외) ---
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

    # --- 손 추출(라벨 우선 배정) ---
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

    # --- 어깨 중점 기준 정렬/스케일 ---
    LSH = mp_pose.PoseLandmark.LEFT_SHOULDER.value
    RSH = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    if any(i not in raw_xy for i in [LSH, RSH]):
        return None
    LS = np.array(raw_xy[LSH], dtype=np.float32)
    RS = np.array(raw_xy[RSH], dtype=np.float32)
    center = 0.5 * (LS + RS)

    pose_xy -= center
    hand_xy -= center

    v = RS - LS
    theta = math.atan2(v[1], v[0])
    c, s = math.cos(-theta), math.sin(-theta)
    R2 = np.array([[c, -s], [s, c]], dtype=np.float32)
    pose_xy = pose_xy @ R2.T
    hand_xy = hand_xy @ R2.T

    shoulder_width = float(np.linalg.norm((RS - center) @ R2.T - (LS - center) @ R2.T))
    if shoulder_width < 1e-6:
        bbox = pose_xy.max(0) - pose_xy.min(0)
        shoulder_width = float(np.max(bbox))
        if shoulder_width < 1e-6:
            return None
    pose_xy /= shoulder_width
    hand_xy /= shoulder_width

    # 손 포인트 누락은 (0,0)으로 보정 (이미 center 기준으로 이동됨)
    mask = (hand_xy[:, 0] < 0) & (hand_xy[:, 1] < 0)
    if np.any(mask):
        hand_xy[mask] = np.array([0.0, 0.0], dtype=np.float32)

    # --- 플랫 벡터 구성 ---
    vec_xy = np.concatenate([pose_xy.reshape(-1), hand_xy.reshape(-1)], axis=0).astype(np.float32)
    vec_conf = np.concatenate([pose_conf, hand_conf], axis=0).astype(np.float32)

    # --- 3D Z 스케일(어깨폭) ---
    has_world = getattr(pres, "pose_world_landmarks", None) is not None
    if has_world:
        world = pres.pose_world_landmarks.landmark
        z_vals = np.array([world[idx].z for idx in POSE_INDEX_LIST], dtype=np.float32)
        sw_world = np.linalg.norm(
            np.array([world[RSH].x - world[LSH].x,
                      world[RSH].y - world[LSH].y,
                      world[RSH].z - world[LSH].z], dtype=np.float32)
        )
        z_vals = z_vals / (sw_world if sw_world > 1e-6 else 1.0)
    else:
        z_vals = np.zeros(len(POSE_INDEX_LIST), dtype=np.float32)

    pose_xyz = np.concatenate([pose_xy, z_vals.reshape(-1, 1)], axis=1)
    vec_xyz = pose_xyz.reshape(-1).astype(np.float32)

    # --- 시각화 저장 ---
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

# ---------- Row 이미지 생성 ----------
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

@app.post("/ai/upload_images")
async def upload_images(
    images: List[UploadFile] = File(...),
    gameId: str | None = Query(default="unknown-game"),
    team: str | None = Query(default="unknown-team"),
    round_idx: int | None = Query(default=1, alias="round"),
):
    """세 장의 이미지를 받아 동일 포즈 여부를 판정"""
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
    hand_metas, idle_flags, has_world_flags = [], [], []

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
        has_world_flags.append(bool(out.get("has_world", False)))

    #  네거티브 필터: 손이 충분히 보이지 않으면 즉시 실패
    def _num_detected_hands(meta): return sum(1 for st in meta["status"].values() if st == "present_detected")
    imgs_with_any_hand = sum(1 for m in hand_metas if _num_detected_hands(m) >= 1)
    need = {"all": 3, "majority": 2, "any": 1}[NEG_FILTER_REQUIRE]
    if imgs_with_any_hand < need:
        similarities = {"1-2": 0.0, "1-3": 0.0, "2-3": 0.0}
        ts = datetime.datetime.now(KST).strftime("%Y%m%d-%H%M%S")
        archive = os.path.join(base_dir, f"{prefix}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
        team_round_latest = os.path.join(base_dir, f"latest_{team}_r{round_num:02d}.jpg")
        overall_latest = os.path.join(base_dir, "latest.jpg")
        concat_path = concat_images_horizontally_with_text(vis_paths, similarities, False, save_path=archive)
        if concat_path:
            img = cv2.imread(concat_path)
            if img is not None:
                atomic_write(img, team_round_latest)
                atomic_write(img, overall_latest)

        return {
            "ok": True,
            "all_pass": False,
            "scores": similarities,
            "vis_files": [os.path.basename(v) for v in vis_paths],
            "row_file_archive": os.path.basename(archive) if concat_path else None,
            "row_file_team_round_latest": os.path.basename(team_round_latest),
            "row_file_latest": os.path.basename(overall_latest),
            "results_url_base": f"/results/{today_dir}/{gameId}/",
            "hand_status": [{"L": m["status"]["L"], "R": m["status"]["R"]} for m in hand_metas],
            "idle_per_image": idle_flags,
            "reason": f"negative_filter:no_enough_hands ({imgs_with_any_hand}/{need})",
        }

    # ── 규칙 #1: 모두 idle이면 탈락(손이 전혀 안 보임) ──
    all_idle = all(idle_flags)

    # ── 규칙 #2 준비: 세 명 모두 '한 손만'인지 체크 ──
    def _hand_count(meta): return len(_expected_hand_set(meta))
    all_onehand = all(_hand_count(m) == 1 for m in hand_metas)

    # ── 쌍별 손 패턴 사전검사 ──
    def _hands_pair_ok(mi, mj, allow_cross_side_single=False):
        Si = _expected_hand_set(mi); Sj = _expected_hand_set(mj)
        if len(Si) != len(Sj): return False, f"different hand count: {sorted(Si)} vs {sorted(Sj)}"
        if len(Si) == 1 and Si != Sj:
            if allow_cross_side_single: return True, None
            return False, f"different single-hand side: {sorted(Si)} vs {sorted(Sj)}"
        return True, None

    pairs = [(0,1), (1,2), (0,2)]
    pair_gate = {}
    for a,b in pairs:
        ok, reason = _hands_pair_ok(hand_metas[a], hand_metas[b], allow_cross_side_single=all_onehand)
        pair_gate[f"{a+1}-{b+1}"] = {"ok": ok, "reason": reason}

    # ── 유사도 점수 계산 ──
    def pair_score(i, j):
        key = f"{i+1}-{j+1}"
        if not pair_gate[key]["ok"]:
            return 0.0

        # 동적 손/몸 가중
        if USE_DYNAMIC_HAND_WEIGHT:
            w_body, w_hand = _adaptive_whand_wbody(confs[i], confs[j], hand_metas[i], hand_metas[j])
        else:
            w_body, w_hand = W_BODY_2D, W_HAND_2D

        # 안전망: 손 가중 하한
        if w_hand < HAND_WEIGHT_FLOOR:
            w_hand = HAND_WEIGHT_FLOOR
            w_body = 1.0 - w_hand

        # 2D (손 Procrustes 포함)
        s2d = confidence_distance_cd2d(
            vecs_xy[i], vecs_xy[j], confs[i], confs[j],
            scheme_body=SCHEME_BODY_2D, scheme_hand=SCHEME_HAND_2D,
            allow_mirror=True, w_body=w_body, w_hand=w_hand, use_hand=True
        )
        if not np.isfinite(s2d):
            s2d = 0.0

        # 3D (둘 다 world가 있을 때만 사용)
        use_3d_pair = USE_3D and has_world_flags[i] and has_world_flags[j]
        if not use_3d_pair:
            return s2d

        bi = confs[i][:len(POSE_INDEX_LIST)]
        bj = confs[j][:len(POSE_INDEX_LIST)]
        s3d_cd  = confidence_distance_cd3d_aligned(
            vecs_xyz[i], vecs_xyz[j], bi, bj,
            scheme="CD_max", allow_mirror=True, align_idx=ALIGN_IDX
        )
        if not np.isfinite(s3d_cd):
            s3d_cd = 0.0
        s3d_ang = bone_angle_similarity_3d(vecs_xyz[i], vecs_xyz[j], align_idx=ALIGN_IDX)
        if not np.isfinite(s3d_ang):
            s3d_ang = 0.0
        s3d = 0.5 * s3d_cd + 0.5 * s3d_ang

        # 원근 강하면 3D 비중↑
        db = _pair_depth_blend(hand_metas[i], hand_metas[j], base=DEPTH_BLEND)
        return (1 - db) * s2d + db * s3d

    s12 = float(pair_score(0, 1))
    s13 = float(pair_score(0, 2))
    s23 = float(pair_score(1, 2))

    # 최종 판정
    if all_idle:
        match = False
    else:
        if PASS_POLICY == "all":
            match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD and s23 >= PASS_THRESHOLD)
        elif PASS_POLICY == "ref":
            match = (s12 >= PASS_THRESHOLD and s13 >= PASS_THRESHOLD)
        else:
            match = (sum(s >= PASS_THRESHOLD for s in [s12, s13, s23]) >= 2)

    similarities = {"1-2": round(s12, 3), "1-3": round(s13, 3), "2-3": round(s23, 3)}

    # ── Row 이미지 생성/저장 ──
    ts = datetime.datetime.now(KST).strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(base_dir, f"{prefix}_{ts}_{uuid.uuid4().hex[:8]}.jpg")
    team_round_latest = os.path.join(base_dir, f"latest_{team}_r{round_num:02d}.jpg")
    overall_latest = os.path.join(base_dir, "latest.jpg")

    concat_path = concat_images_horizontally_with_text(vis_paths, similarities, match, save_path=archive)
    if concat_path:
        img = cv2.imread(concat_path)
        if img is not None:
            atomic_write(img, team_round_latest)  # 팀·라운드 최신본
            atomic_write(img, overall_latest)    # 게임 전체 최신본

    hand_status = [{"L": m["status"]["L"], "R": m["status"]["R"]} for m in hand_metas]

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

# 정적 서빙 (시각화 이미지 접근용)
app.mount("/results", StaticFiles(directory=RESULTS_ROOT, check_dir=False), name="results")
# 예: http://<host>:<port>/results/2025-08-11/<gameId>/