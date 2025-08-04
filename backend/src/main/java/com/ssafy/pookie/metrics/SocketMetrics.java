package com.ssafy.pookie.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import org.springframework.stereotype.Component;
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
    private final AtomicInteger activeRooms = new AtomicInteger(0);
    private final AtomicInteger totalPlayersInRooms = new AtomicInteger(0);

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
    private final Counter roomsCreated;
    private final Counter roomsDestroyed;
    private final Counter roomJoins;
    private final Counter roomLeaves;

    public SocketMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // 실시간 Gauge 등록
        meterRegistry.gauge("socket.connections.active",
                activeConnections,
                AtomicInteger::get);

        meterRegistry.gauge("socket.message.queue.size",
                messageQueueSize,
                AtomicInteger::get);

        meterRegistry.gauge("socket.bytes.received.total",
                totalBytesReceived,
                AtomicLong::get);

        meterRegistry.gauge("socket.bytes.sent.total",
                totalBytesSent,
                AtomicLong::get);

        meterRegistry.gauge("game.rooms.active",
                activeRooms,
                AtomicInteger::get);

        meterRegistry.gauge("game.players.in_rooms.total",
                totalPlayersInRooms,
                AtomicInteger::get);

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

        this.roomsCreated = Counter.builder("game.rooms.created")
                .description("생성된 방 수")
                .register(meterRegistry);

        this.roomsDestroyed = Counter.builder("game.rooms.destroyed")
                .description("삭제된 방 수")
                .register(meterRegistry);

        this.roomJoins = Counter.builder("game.room.joins")
                .description("방 입장 수")
                .register(meterRegistry);

        this.roomLeaves = Counter.builder("game.room.leaves")
                .description("방 퇴장 수")
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
        meterRegistry.counter("socket.connection.rejected",
                        Tags.of("reason", reason))
                .increment();
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
        meterRegistry.counter("socket.messages.received",
                        Tags.of("type", messageType))
                .increment();
        totalBytesReceived.addAndGet(bytes);
    }

    public void recordMessageSent(String messageType, int bytes) {
        meterRegistry.counter("socket.messages.sent",
                        Tags.of("type", messageType))
                .increment();
        totalBytesSent.addAndGet(bytes);
    }

    public void recordMessageDropped(String reason) {
        meterRegistry.counter("socket.messages.dropped",
                        Tags.of("reason", reason))
                .increment();
    }

    public void recordAuthenticationFailure(String reason) {
        meterRegistry.counter("socket.auth.failures",
                        Tags.of("reason", reason))
                .increment();
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

    // 방 관련 메트릭 메서드들
    public void recordRoomCreated(String gameType) {
        meterRegistry.counter("game.rooms.created",
                        Tags.of("game_type", gameType))
                .increment();
        activeRooms.incrementAndGet();
    }

    public void recordRoomDestroyed(String gameType) {
        meterRegistry.counter("game.rooms.destroyed",
                        Tags.of("game_type", gameType))
                .increment();
        activeRooms.decrementAndGet();
    }

    public void recordRoomJoin(String gameType, String team) {
        meterRegistry.counter("game.room.joins",
                        Tags.of("game_type", gameType, "team", team))
                .increment();
        totalPlayersInRooms.incrementAndGet();
    }

    public void recordRoomLeave(String gameType, String team) {
        meterRegistry.counter("game.room.leaves",
                        Tags.of("game_type", gameType, "team", team))
                .increment();
        totalPlayersInRooms.decrementAndGet();
    }

    public void updateActiveRoomsCount(int count) {
        activeRooms.set(count);
    }

    public void updateTotalPlayersInRoomsCount(int count) {
        totalPlayersInRooms.set(count);
    }
}
