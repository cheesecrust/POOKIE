package com.ssafy.pookie.socket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.message.dto.MessageDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class WebSocketMessageHandlingTest {

    private ObjectMapper objectMapper;
    private BlockingQueue<String> messageQueue;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        messageQueue = new LinkedBlockingQueue<>();
    }

    @Test
    void testBasicMessageCreation() {
        // 기본 메시지 생성 테스트
        MessageDto messageDto = new MessageDto();
        messageDto.setType(MessageDto.Type.CHAT);
        messageDto.setPayload(new HashMap<>());

        assertEquals(MessageDto.Type.CHAT, messageDto.getType());
        assertNotNull(messageDto.getPayload());
    }

    @Test
    void testSimpleJsonSerialization() throws Exception {
        // 간단한 JSON 직렬화 테스트
        Map<String, Object> simplePayload = new HashMap<>();
        simplePayload.put("message", "Hello");
        simplePayload.put("roomId", "test-room");

        MessageDto messageDto = new MessageDto();
        messageDto.setType(MessageDto.Type.CHAT);
        messageDto.setPayload(simplePayload);

        String json = objectMapper.writeValueAsString(messageDto);
        assertNotNull(json);
        assertTrue(json.contains("CHAT"));
        assertTrue(json.contains("Hello"));
    }

    @Test
    void testMessageTypeEnumValues() {
        // 메시지 타입 enum 값들 테스트
        assertNotNull(MessageDto.Type.CHAT);
        assertNotNull(MessageDto.Type.ROOM_JOIN);
        assertNotNull(MessageDto.Type.WAITING_USER_LEAVE);
        
        // enum 값이 문자열로 변환되는지 확인
        assertEquals("CHAT", MessageDto.Type.CHAT.toString());
        assertEquals("ROOM_JOIN", MessageDto.Type.ROOM_JOIN.toString());
    }

    @Test
    void testBasicJsonParsing() throws Exception {
        // 기본 JSON 파싱 테스트
        String simpleJson = "{\"type\":\"CHAT\",\"payload\":{\"message\":\"hello\"}}";
        
        MessageDto messageDto = objectMapper.readValue(simpleJson, MessageDto.class);
        assertEquals(MessageDto.Type.CHAT, messageDto.getType());
        assertNotNull(messageDto.getPayload());
    }

    @Test
    void testMessageQueueOperations() throws InterruptedException {
        // 메시지 큐 동작 테스트
        assertTrue(messageQueue.isEmpty());
        
        messageQueue.offer("Message 1");
        messageQueue.offer("Message 2");
        
        assertEquals(2, messageQueue.size());
        
        String msg1 = messageQueue.poll(1, TimeUnit.SECONDS);
        String msg2 = messageQueue.poll(1, TimeUnit.SECONDS);
        
        assertEquals("Message 1", msg1);
        assertEquals("Message 2", msg2);
        assertTrue(messageQueue.isEmpty());
    }

    @Test
    void testConcurrentMessageHandling() throws InterruptedException {
        // 간단한 동시성 테스트
        int messageCount = 10;
        
        Thread producer = new Thread(() -> {
            for (int i = 0; i < messageCount; i++) {
                messageQueue.offer("Message " + i);
            }
        });

        producer.start();
        producer.join();

        assertEquals(messageCount, messageQueue.size());
        
        // 모든 메시지 소비
        for (int i = 0; i < messageCount; i++) {
            String message = messageQueue.poll(1, TimeUnit.SECONDS);
            assertNotNull(message);
        }
        
        assertTrue(messageQueue.isEmpty());
    }
}