package com.ssafy.pookie.socket;

import com.ssafy.pookie.metrics.SocketMetrics;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CountDownLatch;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class SocketMetricsTest {

    private SocketMetrics socketMetrics;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        socketMetrics = new SocketMetrics(meterRegistry);
    }

    @Test
    void testConnectionMetrics() {
        // 연결 시도 기록
        socketMetrics.recordConnectionAttempt();
        assertEquals(1.0, meterRegistry.counter("socket.connection.attempts").count());

        // 연결 수락 기록
        String sessionId = "test-session-1";
        socketMetrics.recordConnectionAccepted(sessionId);
        assertEquals(1.0, meterRegistry.counter("socket.connection.accepted").count());
        assertEquals(1.0, meterRegistry.get("socket.connections.active").gauge().value());

        // 연결 거부 기록
        socketMetrics.recordConnectionRejected("invalid_token");
        assertEquals(1.0, meterRegistry.counter("socket.connection.rejected", "reason", "invalid_token").count());

        // 연결 종료 기록
        socketMetrics.recordConnectionClosed(sessionId);
        assertEquals(1.0, meterRegistry.counter("socket.connection.closed").count());
        assertEquals(0.0, meterRegistry.get("socket.connections.active").gauge().value());
    }

    @Test
    void testMessageMetrics() {
        // 메시지 수신 기록
        socketMetrics.recordMessageReceived("CHAT", 150);
        assertEquals(1.0, meterRegistry.counter("socket.messages.received", "type", "CHAT").count());
        assertEquals(150.0, meterRegistry.get("socket.bytes.received.total").gauge().value());

        // 메시지 전송 기록
        socketMetrics.recordMessageSent("ROOM_UPDATE", 200);
        assertEquals(1.0, meterRegistry.counter("socket.messages.sent", "type", "ROOM_UPDATE").count());
        assertEquals(200.0, meterRegistry.get("socket.bytes.sent.total").gauge().value());

        // 메시지 드롭 기록
        socketMetrics.recordMessageDropped("queue_full");
        assertEquals(1.0, meterRegistry.counter("socket.messages.dropped", "reason", "queue_full").count());

        // 인증 실패 기록
        socketMetrics.recordAuthenticationFailure("expired_token");
        assertEquals(1.0, meterRegistry.counter("socket.auth.failures", "reason", "expired_token").count());
    }

    @Test
    void testRoomMetrics() {
        // 방 생성 기록
        socketMetrics.recordRoomCreated("DRAWING_GAME");
        assertEquals(1.0, meterRegistry.counter("game.rooms.created", "game_type", "DRAWING_GAME").count());
        assertEquals(1.0, meterRegistry.get("game.rooms.active").gauge().value());

        // 방 입장 기록
        socketMetrics.recordRoomJoin("DRAWING_GAME", "TEAM_A");
        assertEquals(1.0, meterRegistry.counter("game.room.joins", "game_type", "DRAWING_GAME", "team", "TEAM_A").count());
        assertEquals(1.0, meterRegistry.get("game.players.in_rooms.total").gauge().value());

        // 방 퇴장 기록
        socketMetrics.recordRoomLeave("DRAWING_GAME", "TEAM_A");
        assertEquals(1.0, meterRegistry.counter("game.room.leaves", "game_type", "DRAWING_GAME", "team", "TEAM_A").count());
        assertEquals(0.0, meterRegistry.get("game.players.in_rooms.total").gauge().value());

        // 방 삭제 기록
        socketMetrics.recordRoomDestroyed("DRAWING_GAME");
        assertEquals(1.0, meterRegistry.counter("game.rooms.destroyed", "game_type", "DRAWING_GAME").count());
        assertEquals(0.0, meterRegistry.get("game.rooms.active").gauge().value());
    }

    @Test
    void testMessageQueueMetrics() {
        // 큐 사이즈 변경
        socketMetrics.setMessageQueueSize(10);
        assertEquals(10.0, meterRegistry.get("socket.message.queue.size").gauge().value());

        // 큐 증가/감소
        socketMetrics.incrementMessageQueue();
        assertEquals(11.0, meterRegistry.get("socket.message.queue.size").gauge().value());

        socketMetrics.decrementMessageQueue();
        assertEquals(10.0, meterRegistry.get("socket.message.queue.size").gauge().value());
    }

    @Test
    void testTimingMetrics() throws InterruptedException {
        // 메시지 처리 시간 측정
        var sample = socketMetrics.startMessageProcessing();
        Thread.sleep(100); // 100ms 처리 시간 시뮬레이션
        socketMetrics.endMessageProcessing(sample, "CHAT");

        var timer = meterRegistry.timer("socket.message.processing.time", "type", "CHAT");
        assertEquals(1, timer.count());
        assertTrue(timer.mean(TimeUnit.MILLISECONDS) >= 100);

        // 연결 처리 시간 측정
        var connectionSample = socketMetrics.startConnectionHandling();
        Thread.sleep(50); // 50ms 연결 처리 시간 시뮬레이션
        socketMetrics.endConnectionHandling(connectionSample);

        var connectionTimer = meterRegistry.timer("socket.connection.handling.time");
        assertEquals(1, connectionTimer.count());
        assertTrue(connectionTimer.mean(TimeUnit.MILLISECONDS) >= 50);
    }

    @Test
    void testConcurrentMetricsUpdates() throws InterruptedException {
        int threadCount = 10;
        int operationsPerThread = 100;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        // 동시에 여러 스레드에서 메트릭 업데이트
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    for (int j = 0; j < operationsPerThread; j++) {
                        // 연결 시뮬레이션
                        String sessionId = "session-" + threadId + "-" + j;
                        socketMetrics.recordConnectionAccepted(sessionId);
                        
                        // 메시지 전송/수신 시뮬레이션
                        socketMetrics.recordMessageReceived("CHAT", 100);
                        socketMetrics.recordMessageSent("RESPONSE", 50);
                        
                        // 방 관련 작업 시뮬레이션
                        if (j % 10 == 0) {
                            socketMetrics.recordRoomCreated("GAME_TYPE_" + threadId);
                            socketMetrics.recordRoomJoin("GAME_TYPE_" + threadId, "TEAM_" + (j % 2));
                        }
                        
                        // 짧은 대기
                        Thread.sleep(1);
                        
                        // 연결 종료
                        socketMetrics.recordConnectionClosed(sessionId);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    latch.countDown();
                }
            });
        }

        // 모든 작업 완료 대기
        assertTrue(latch.await(30, TimeUnit.SECONDS));
        executor.shutdown();

        // 메트릭 값 검증
        double expectedConnections = threadCount * operationsPerThread;
        assertEquals(expectedConnections, meterRegistry.counter("socket.connection.accepted").count());
        assertEquals(expectedConnections, meterRegistry.counter("socket.connection.closed").count());
        assertEquals(0.0, meterRegistry.get("socket.connections.active").gauge().value()); // 모든 연결이 종료됨

        double expectedMessages = threadCount * operationsPerThread;
        assertEquals(expectedMessages, meterRegistry.counter("socket.messages.received", "type", "CHAT").count());
        assertEquals(expectedMessages, meterRegistry.counter("socket.messages.sent", "type", "RESPONSE").count());

        // 바이트 수 확인
        double expectedReceivedBytes = expectedMessages * 100;
        double expectedSentBytes = expectedMessages * 50;
        assertEquals(expectedReceivedBytes, meterRegistry.get("socket.bytes.received.total").gauge().value());
        assertEquals(expectedSentBytes, meterRegistry.get("socket.bytes.sent.total").gauge().value());
    }

    @Test
    void testMetricsReset() {
        // 초기 메트릭 설정
        socketMetrics.recordConnectionAccepted("session-1");
        socketMetrics.recordMessageReceived("CHAT", 100);
        socketMetrics.recordRoomCreated("GAME");

        // 값이 설정되었는지 확인
        assertTrue(meterRegistry.counter("socket.connection.accepted").count() > 0);
        assertTrue(meterRegistry.get("socket.bytes.received.total").gauge().value() > 0);
        assertTrue(meterRegistry.get("game.rooms.active").gauge().value() > 0);

        // 연결 종료 및 방 삭제
        socketMetrics.recordConnectionClosed("session-1");
        socketMetrics.recordRoomDestroyed("GAME");

        // Gauge 값들이 올바르게 업데이트되었는지 확인
        assertEquals(0.0, meterRegistry.get("socket.connections.active").gauge().value());
        assertEquals(0.0, meterRegistry.get("game.rooms.active").gauge().value());

        // Counter는 리셋되지 않음 (누적값)
        assertTrue(meterRegistry.counter("socket.connection.accepted").count() > 0);
    }

    @Test
    void testErrorMetrics() {
        // 다양한 에러 시나리오 테스트
        socketMetrics.recordConnectionRejected("invalid_token");
        socketMetrics.recordConnectionRejected("rate_limit");
        socketMetrics.recordConnectionRejected("invalid_token"); // 중복

        socketMetrics.recordMessageDropped("queue_full");
        socketMetrics.recordMessageDropped("invalid_format");

        socketMetrics.recordAuthenticationFailure("expired_token");
        socketMetrics.recordAuthenticationFailure("malformed_token");

        // 에러 메트릭 검증
        assertEquals(2.0, meterRegistry.counter("socket.connection.rejected", "reason", "invalid_token").count());
        assertEquals(1.0, meterRegistry.counter("socket.connection.rejected", "reason", "rate_limit").count());

        assertEquals(1.0, meterRegistry.counter("socket.messages.dropped", "reason", "queue_full").count());
        assertEquals(1.0, meterRegistry.counter("socket.messages.dropped", "reason", "invalid_format").count());

        assertEquals(1.0, meterRegistry.counter("socket.auth.failures", "reason", "expired_token").count());
        assertEquals(1.0, meterRegistry.counter("socket.auth.failures", "reason", "malformed_token").count());
    }
}