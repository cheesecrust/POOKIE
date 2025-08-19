package com.ssafy.pookie.socket;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.springframework.web.socket.*;

import java.net.URI;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import static org.junit.jupiter.api.Assertions.*;

public class WebSocketClientConnectionTest {

    private SpringTestWebSocketClient client;

    @BeforeEach
    void setUp() {
        // 테스트 환경 초기화
    }

    @AfterEach
    void tearDown() throws Exception {
        if (client != null && client.isOpen()) {
            client.closeBlocking();
        }
    }

    @Test
    void testWebSocketClientCreation() {
        // WebSocket 클라이언트 생성 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        
        assertDoesNotThrow(() -> {
            SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
            assertNotNull(testClient);
            assertFalse(testClient.isConnected());
            assertFalse(testClient.isOpen());
        });
    }

    @Test
    void testMessageQueueFunctionality() throws InterruptedException {
        // 메시지 큐 기능 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        BlockingQueue<String> messageQueue = testClient.getReceivedMessages();
        
        // 빈 큐 확인
        assertTrue(messageQueue.isEmpty());
        
        // 메시지 추가
        messageQueue.offer("Test Message 1");
        messageQueue.offer("Test Message 2");
        
        assertEquals(2, messageQueue.size());
        
        // 메시지 순서대로 폴링
        String msg1 = messageQueue.poll(1, TimeUnit.SECONDS);
        String msg2 = messageQueue.poll(1, TimeUnit.SECONDS);
        
        assertEquals("Test Message 1", msg1);
        assertEquals("Test Message 2", msg2);
        assertTrue(messageQueue.isEmpty());
    }

    @Test
    void testConnectionStateManagement() {
        // 연결 상태 관리 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        // 초기 상태
        assertFalse(testClient.isConnected());
        assertFalse(testClient.isOpen());
        assertNull(testClient.getLastError());
    }

    @Test
    void testMessageWaitFunctionality() throws InterruptedException {
        // 메시지 대기 기능 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        BlockingQueue<String> messageQueue = testClient.getReceivedMessages();
        
        // 메시지가 없을 때 대기 테스트
        long startTime = System.currentTimeMillis();
        boolean hasMessage = testClient.waitForMessage(1); // 1초 대기
        long endTime = System.currentTimeMillis();
        
        assertFalse(hasMessage);
        assertTrue((endTime - startTime) >= 1000); // 최소 1초는 대기했어야 함
        
        // 메시지 추가 후 대기 테스트
        messageQueue.offer("Test Message");
        assertTrue(testClient.waitForMessage(1)); // 즉시 반환되어야 함
    }

    @Test
    void testErrorHandling() {
        // 에러 처리 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        // 잘못된 URI로 연결 시도 시 에러 처리
        assertDoesNotThrow(() -> {
            boolean connected = testClient.connectBlocking();
            assertFalse(connected); // 연결 실패 예상
            
            String error = testClient.getLastError();
            assertNotNull(error); // 에러 메시지가 있어야 함
        });
    }

    @Test
    void testConcurrentMessageProcessing() throws InterruptedException {
        // 동시 메시지 처리 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        BlockingQueue<String> messageQueue = testClient.getReceivedMessages();
        int messageCount = 100;
        CountDownLatch latch = new CountDownLatch(2);
        
        // 메시지 생산자 스레드
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < messageCount; i++) {
                    messageQueue.offer("Message " + i);
                    Thread.sleep(1); // 작은 지연
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                latch.countDown();
            }
        });
        
        // 메시지 소비자 스레드
        Thread consumer = new Thread(() -> {
            try {
                int consumed = 0;
                while (consumed < messageCount) {
                    String message = messageQueue.poll(100, TimeUnit.MILLISECONDS);
                    if (message != null) {
                        consumed++;
                        assertTrue(message.startsWith("Message "));
                    }
                }
                assertEquals(messageCount, consumed);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                latch.countDown();
            }
        });
        
        producer.start();
        consumer.start();
        
        assertTrue(latch.await(10, TimeUnit.SECONDS));
        assertTrue(messageQueue.isEmpty());
    }

    @Test
    void testWebSocketHandlerMethods() {
        // WebSocketHandler 메서드 테스트
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        // WebSocketHandler 인터페이스 구현 확인
        assertTrue(testClient instanceof WebSocketHandler);
        assertFalse(testClient.supportsPartialMessages());
        
        // 핸들러 메서드들이 예외 없이 호출되는지 확인
        assertDoesNotThrow(() -> {
            // 가상의 세션과 메시지로 테스트
            testClient.afterConnectionClosed(null, CloseStatus.NORMAL);
            testClient.handleTransportError(null, new RuntimeException("Test error"));
        });
    }

    @Test
    void testMessageSending() {
        // 메시지 전송 테스트 (연결되지 않은 상태)
        URI testUri = URI.create("ws://localhost:8080/test");
        SpringTestWebSocketClient testClient = new SpringTestWebSocketClient(testUri);
        
        // 연결되지 않은 상태에서 메시지 전송 시 예외가 발생하지 않아야 함
        assertDoesNotThrow(() -> {
            testClient.send("Test message");
        });
        
        assertFalse(testClient.isOpen());
    }
}