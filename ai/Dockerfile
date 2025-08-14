FROM python:3.10-slim-bookworm

# 환경 변수 (로그 버퍼링 방지 + 캐시파일 방지)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Seoul

# 필수 라이브러리 설치 (Mediapipe & OpenCV 실행에 필요)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements 설치
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# 빌드 타임에 mediapipe 모델 캐시(루트 권한으로 받아서 런타임 권한 이슈 제거)
RUN python - <<'PY'
import mediapipe as mp
mp.solutions.pose.Pose(static_image_mode=True, model_complexity=2)
mp.solutions.hands.Hands(static_image_mode=True)
print("mediapipe models warmed")
PY

# 앱 소스 복사
COPY . .

# 운영: reload X. 우선 worker=1로 안정화
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8001","--workers","1","--timeout-keep-alive","75","--log-level","info"]