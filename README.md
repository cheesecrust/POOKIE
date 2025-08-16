# 🎮 Pookie - Real-time Multiplayer Game Platform

> **Pookie**는 포즈 매칭, 몸짓 게임, 그림 릴레이 등 다양한 실시간 멀티플레이어 게임을 제공하는 웹 기반 게임 플랫폼입니다.

## 🎯 프로젝트 개요

Pookie는 친구들과 함께 즐길 수 있는 다양한 미니게임을 제공하는 실시간 멀티플레이어 게임 플랫폼입니다. 웹캠을 활용한 포즈 매칭 게임부터 창의적인 그림 그리기 게임까지, 누구나 쉽게 즐길 수 있는 게임들로 구성되어 있습니다.

### ✨ 주요 기능

- **🤸‍♀️ Same Pose**: AI 포즈 인식을 활용한 포즈 매칭 게임
- **🤫 Silent Scream**: 입모양으로 단어를 표현하는 게임
- **🎨 Sketch Relay**: 실시간 협동 그림 그리기 게임
- **💬 실시간 채팅**: WebSocket 기반 실시간 메시징
- **👫 친구 시스템**: 친구 추가 및 개인 메시지 기능
- **🎭 캐릭터 시스템**: 캐릭터를 진화 시키는 시스템
- **🏪 상점 시스템**: 게임 내 화폐로 아이템 구매

## 🏗️ 시스템 아키텍처

### 전체 구조
```
Pookie Platform
├── Frontend (React 19 + Vite)
├── Backend (Spring Boot 3.5)
└── AI Service (FastAPI + MediaPipe)
```

### 📱 Frontend
- **프레임워크**: React 19 + Vite
- **상태 관리**: Zustand with localStorage persistence
- **스타일링**: TailwindCSS 4.1.11
- **실시간 통신**: WebSocket + LiveKit
- **라우팅**: React Router DOM 7.7.0

### 🚀 Backend
- **프레임워크**: Spring Boot 3.5
- **데이터베이스**: MySQL with JPA/Hibernate
- **인증**: JWT + OAuth2 (Kakao)
- **실시간 통신**: WebSocket + STOMP
- **비디오 통신**: LiveKit Server SDK
- **모니터링**: Prometheus + Actuator

### 🤖 AI Service
- **프레임워크**: FastAPI
- **포즈 인식**: MediaPipe
- **이미지 처리**: OpenCV with CLAHE
- **유사도 계산**: Cosine similarity with keyword weighting

## 🎮 게임 소개

- **턴 기반 시스템**: 모든 게임은 타이머 기반 차례 교체 게임입니다.

### 🤸‍♀️ Same Pose (포즈 매칭)
AI를 활용한 포즈 인식 기술로 제시된 포즈를 따라하는 게임입니다.
- **기술**: MediaPipe 포즈 랜드마크 + 손 랜드마크 인식
- **점수 계산**: 코사인 유사도 기반 정확도 측정


### 🤫 Silent Scream (몸짓 게임)
제시된 단어를 몸짓으로 표현하여 다른 플레이어가 맞추는 게임입니다.
- **비디오 통신**: LiveKit을 통한 실시간 영상 공유
- **실시간 채팅**: 게임중의 채팅 시스템

### 🎨 Sketch Relay (그림 릴레이)
팀원들이 돌아가며 그림을 그려 완성하는 협동 게임입니다.
- **실시간 드로잉**: WebSocket을 통한 실시간 그림 동기화

## 🛠️ 기술 스택

### Frontend
```json
{
  "react": "^19.1.0",
  "vite": "^7.0.4",
  "tailwindcss": "^4.1.11",
  "zustand": "^5.0.6",
  "livekit-client": "^2.15.3",
  "openvidu-browser": "^2.31.0"
}
```

### Backend
```gradle
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'
  implementation 'org.springframework.boot:spring-boot-starter-websocket'
  implementation 'org.springframework.boot:spring-boot-starter-security'
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  implementation 'io.livekit:livekit-server:0.10.0'
  implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
}
```

### AI Service
```txt
fastapi==0.116.1
mediapipe==0.10.21
opencv-contrib-python==4.11.0.86
scikit-learn==1.7.1
```

## 🚀 시작하기

### 사전 요구사항
- **Node.js** 18+ 
- **Java** 17+
- **Python** 3.8+
- **MySQL** 8.0+

### 설치 및 실행

#### 1. Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

#### 2. Backend 실행
```bash
cd backend
./gradlew bootRun
```

#### 3. AI Service 실행
```bash
cd ai
pip install -r requirements.txt
python main.py
```

### 환경 설정

#### Backend 설정 (application.properties)
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/pookie
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT
jwt.secret=your_jwt_secret

# LiveKit
livekit.api.key=your_livekit_key
livekit.api.secret=your_livekit_secret
```

## 📁 프로젝트 구조

```
📦 Pookie
├── 📂 frontend/                    # React 프론트엔드
│   ├── 📂 src/
│   │   ├── 📂 components/          # 컴포넌트 (Atomic Design)
│   │   │   ├── 📂 atoms/           # 기본 UI 요소
│   │   │   ├── 📂 molecules/       # 조합된 컴포넌트
│   │   │   └── 📂 organisms/       # 복잡한 컴포넌트
│   │   ├── 📂 pages/               # 페이지 컴포넌트
│   │   ├── 📂 store/               # Zustand 상태 관리
│   │   ├── 📂 sockets/             # WebSocket 핸들러
│   │   └── 📂 utils/               # 유틸리티 함수
│   └── 📄 package.json
├── 📂 backend/                     # Spring Boot 백엔드
│   ├── 📂 src/main/java/com/ssafy/pookie/
│   │   ├── 📂 auth/                # 인증 시스템
│   │   ├── 📂 game/                # 게임 로직
│   │   │   ├── 📂 server/          # 게임 서버
│   │   │   ├── 📂 room/            # 방 관리
│   │   │   ├── 📂 draw/            # 그림 동기화
│   │   │   └── 📂 timer/           # 게임 타이머
│   │   ├── 📂 character/           # 캐릭터 시스템
│   │   ├── 📂 friend/              # 친구 시스템
│   │   └── 📂 webrtc/              # 비디오 통신
│   └── 📄 build.gradle
├── 📂 ai/                          # AI 포즈 인식 서비스
│   ├── 📄 main.py                  # FastAPI 서버
│   └── 📄 requirements.txt
└── 📄 README.md
```

## 아키텍쳐 구조

## erd

## 🔧 주요 설정

### Frontend 개발 서버
```bash
npm run dev        # 개발 서버 시작 (http://localhost:5173)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 실행
npm run preview    # 프로덕션 빌드 미리보기
```

### Backend 개발
```bash
./gradlew bootRun          # 개발 서버 시작 (http://localhost:8080)
./gradlew build            # 애플리케이션 빌드
./gradlew test             # 테스트 실행
./gradlew bootJar          # 실행 가능한 JAR 생성
```

### AI Service
```bash
python main.py             # FastAPI 서버 시작 (http://localhost:8000)
```

## 🎮 게임 플레이 가이드

### 1. 회원가입 및 로그인
- 일반 회원가입 또는 카카오 OAuth 로그인 지원
- JWT 토큰 기반 인증 시스템

### 2. 게임 방 생성/참여
- 비밀번호가 있는 비공개 방 생성 가능
- 최대 4명까지 참여 가능
- 실시간 방 목록 업데이트

### 3. 게임 종류별 플레이 방법

#### Same Pose
1. 웹캠 권한 허용
2. 화면에 표시되는 포즈 따라하기
3. AI가 포즈 정확도를 실시간 채점
4. 가장 높은 점수를 받은 플레이어 승리

#### Silent Scream
1. 차례대로 제시어를 몸짓으로 표현
2. 다른 플레이어들이 채팅으로 정답 입력
3. 제한 시간 내에 정답 맞추기
4. 표현자와 정답자 모두 점수 획득

#### Sketch Relay
1. 팀별로 나누어 릴레이 그림 그리기
2. 각자 제한 시간 동안 그림 이어그리기
3. 마지막에 완성된 그림의 주제 맞추기
4. 팀 단위로 점수 계산

## 👥 팀원

- **Frontend**: React 기반 실시간 게임 UI/UX 개발
- **Backend**: Spring Boot 기반 게임 서버 및 실시간 통신 구현  
- **AI**: MediaPipe 기반 포즈 인식 및 유사도 계산 시스템 개발
