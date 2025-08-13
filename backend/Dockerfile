# Build stage - 의존성 캐싱 최적화
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Gradle 설정 파일들만 먼저 복사 (의존성 캐싱용)
COPY build.gradle settings.gradle ./
COPY gradle gradle/

# 의존성만 먼저 다운로드 - 이 레이어는 build.gradle이 변경되지 않는 한 캐시됨
RUN gradle dependencies --no-daemon --parallel

# 소스 코드 복사 및 빌드
COPY src src/

# JAR 빌드 - 소스코드가 변경된 경우에만 재빌드
RUN gradle bootJar --no-daemon --parallel --build-cache

# Runtime stage - 최종 이미지 크기 최소화
FROM openjdk:17-jre-slim
WORKDIR /app

# 필요한 패키지 설치 (healthcheck용 curl)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 빌드된 JAR 파일만 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# 애플리케이션 실행
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]