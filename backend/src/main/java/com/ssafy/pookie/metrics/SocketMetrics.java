package com.ssafy.pookie.metrics;

import org.springframework.stereotype.Component;
import org.w3c.dom.css.Counter;

import java.util.Timer;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.Duration;

@Component
public class SocketMetrics {

    private final MeterRegistry meterRegistry;

    // 실시간 카운터들
    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final AtomicInteger messageQueueSize = new AtomicInteger(0);
    private final AtomicLong totalBytesReceived = new AtomicLong(0);
    private final AtomicLong totalBytesSent = new AtomicLong(0);

    // 연결 시작 시간 추적
    private final ConcurrentHashMap<String, LocalDateTime> connectionStartTimes = new ConcurrentHashMap<>();

    // Micrometer 메트릭들
    private final Counter connectionAttempts;
    private final Counter connectionAccepted;
    private final Counter connectionRejected;
    private final Counter connectionClosed;
    private final Counter messagesReceived;
    private final Counter messagesSent;
    private final Counter messagesDropped;
    private final Counter authenticationFailures;
    private final Timer messageProcessingTime;
    private final Timer connectionHandlingTime;

    public SocketMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // 실시간 Gauge 등록
        Gauge.builder("socket.connections.active")
                .description("현재 활성 소켓 연결 수")
                .register(meterRegistry, activeConnections, AtomicInteger::get);

        Gauge.builder("socket.message.queue.size")
                .description("대기 중인 메시지 수")
                .register(meterRegistry, messageQueueSize, AtomicInteger::get);

        Gauge.builder("socket.bytes.received.total")
                .description("총 수신 바이트 수")
                .register(meterRegistry, totalBytesReceived, AtomicLong::get);

        Gauge.builder("socket.bytes.sent.total")
                .description("총 송신 바이트 수")
                .register(meterRegistry, totalBytesSent, AtomicLong::get);

        // 카운터 등록
        this.connectionAttempts = Counter.builder("socket.connection.attempts")
                .description("소켓 연결 시도 수")
                .register(meterRegistry);

        this.connectionAccepted = Counter.builder("socket.connection.accepted")
                .description("수락된 연결 수")
                .register(meterRegistry);

        this.connectionRejected = Counter.builder("socket.connection.rejected")
                .description("거부된 연결 수")
                .register(meterRegistry);

        this.connectionClosed = Counter.builder("socket.connection.closed")
                .description("종료된 연결 수")
                .register(meterRegistry);

        this.messagesReceived = Counter.builder("socket.messages.received")
                .description("수신된 메시지 수")
                .register(meterRegistry);

        this.messagesSent = Counter.builder("socket.messages.sent")
                .description("송신된 메시지 수")
                .register(meterRegistry);

        this.messagesDropped = Counter.builder("socket.messages.dropped")
                .description("드롭된 메시지 수")
                .register(meterRegistry);

        this.authenticationFailures = Counter.builder("socket.auth.failures")
                .description("인증 실패 수")
                .register(meterRegistry);

        // 타이머 등록
        this.messageProcessingTime = Timer.builder("socket.message.processing.time")
                .description("메시지 처리 시간")
                .register(meterRegistry);

        this.connectionHandlingTime = Timer.builder("socket.connection.handling.time")
                .description("연결 처리 시간")
                .register(meterRegistry);
    }

    // 연결 관련 메트릭 메서드들
    public void recordConnectionAttempt() {
        connectionAttempts.increment();
    }

    public void recordConnectionAccepted(String sessionId) {
        connectionAccepted.increment();
        activeConnections.incrementAndGet();
        connectionStartTimes.put(sessionId, LocalDateTime.now());
    }

    public void recordConnectionRejected(String reason) {
        connectionRejected.increment(Tags.of("reason", reason));
    }

    public void recordConnectionClosed(String sessionId) {
        connectionClosed.increment();
        activeConnections.decrementAndGet();

        // 연결 지속 시간 기록
        LocalDateTime startTime = connectionStartTimes.remove(sessionId);
        if (startTime != null) {
            Duration duration = Duration.between(startTime, LocalDateTime.now());
            Timer.builder("socket.connection.duration")
                    .description("연결 지속 시간")
                    .register(meterRegistry)
                    .record(duration);
        }
    }

    // 메시지 관련 메트릭 메서드들
    public void recordMessageReceived(String messageType, int bytes) {
        messagesReceived.increment(Tags.of("type", messageType));
        totalBytesReceived.addAndGet(bytes);
    }

    public void recordMessageSent(String messageType, int bytes) {
        messagesSent.increment(Tags.of("type", messageType));
        totalBytesSent.addAndGet(bytes);
    }

    public void recordMessageDropped(String reason) {
        messagesDropped.increment(Tags.of("reason", reason));
    }

    public void recordAuthenticationFailure(String reason) {
        authenticationFailures.increment(Tags.of("reason", reason));
    }

    // 처리 시간 측정
    public Timer.Sample startMessageProcessing() {
        return Timer.start(meterRegistry);
    }

    public void endMessageProcessing(Timer.Sample sample, String messageType) {
        sample.stop(Timer.builder("socket.message.processing.time")
                .tag("type", messageType)
                .register(meterRegistry));
    }

    public Timer.Sample startConnectionHandling() {
        return Timer.start(meterRegistry);
    }

    public void endConnectionHandling(Timer.Sample sample) {
        sample.stop(connectionHandlingTime);
    }

    // 큐 관리
    public void setMessageQueueSize(int size) {
        messageQueueSize.set(size);
    }

    public void incrementMessageQueue() {
        messageQueueSize.incrementAndGet();
    }

    public void decrementMessageQueue() {
        messageQueueSize.decrementAndGet();
    }
}
