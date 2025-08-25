package com.ssafy.pookie.game.message.manager;

import com.ssafy.pookie.game.message.dto.SendMessageDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.WebSocketSession;

import java.lang.reflect.Field;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class MessageSenderManagerTest {

    private static final Logger log = LoggerFactory.getLogger(MessageSenderManagerTest.class);
    @Mock
    private OnlinePlayerManager onlinePlayerManager;

    @Mock
    private WebSocketSession mockSession;

    private MessageSenderManager messageSenderManager;

    @BeforeEach
    void setUp() {
        messageSenderManager = new MessageSenderManager(onlinePlayerManager);
    }

    @Test
    void testCreateRoomMessageQueue() throws Exception {
        String roomId = "test-room-1";
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertTrue(sendMessage.containsKey(roomId));
        assertNotNull(sendMessage.get(roomId));
        assertTrue(sendMessage.get(roomId).isEmpty());
    }

    @Test
    void testSendMessageToUser() throws Exception {
        String roomId = "test-room-1";
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Hello User");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        assertEquals(1, queue.size());
        SendMessageDto message = queue.peek();
        assertEquals(SendMessageDto.sendType.USER, message.getMsgType());
        assertEquals(mockSession, message.getSession());
        assertEquals(payload, message.getPayload());
    }

    @Test
    void testSendMessageBroadCast() throws Exception {
        String roomId = "test-room-1";
        UserDto.Team team = UserDto.Team.RED;
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Broadcast Message");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageBroadCast(mockSession, roomId, team, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        assertEquals(1, queue.size());
        SendMessageDto message = queue.peek();
        assertEquals(SendMessageDto.sendType.BROADCAST, message.getMsgType());
        assertEquals(roomId, message.getRoomId());
        assertEquals(team, message.getTeam());
        assertEquals(payload, message.getPayload());
    }

    @Test
    void testSendMessageBroadCastOther() throws Exception {
        String roomId = "test-room-1";
        UserDto.Team team = UserDto.Team.BLUE;
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Broadcast Other Message");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageBroadCastOther(mockSession, roomId, team, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        assertEquals(1, queue.size());
        SendMessageDto message = queue.peek();
        assertEquals(SendMessageDto.sendType.BROADCAST_OTHER, message.getMsgType());
        assertEquals(roomId, message.getRoomId());
        assertEquals(team, message.getTeam());
        assertEquals(payload, message.getPayload());
    }

    @Test
    void testMessageQueueOrdering() throws Exception {
        String roomId = "test-room-1";
        Map<String, Object> payload1 = Map.of("message", "First");
        Map<String, Object> payload2 = Map.of("message", "Second");
        Map<String, Object> payload3 = Map.of("message", "Third");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload1);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload2);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload3);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        assertEquals(3, queue.size());
        assertEquals("First", queue.pollFirst().getPayload().get("message"));
        assertEquals("Second", queue.pollFirst().getPayload().get("message"));
        assertEquals("Third", queue.pollFirst().getPayload().get("message"));
    }

    @Test
    void testClearRoomMessageQueue() throws Exception {
        String roomId = "test-room-1";
        Map<String, Object> payload = Map.of("message", "Test");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(1, sendMessage.get(roomId).size());
        
        messageSenderManager.clearRoomMessageQueue(roomId);
        assertTrue(sendMessage.get(roomId).isEmpty());
    }

    @Test
    void testRemoveRoomMessageQueue() throws Exception {
        String roomId = "test-room-1";
        Map<String, Object> payload = Map.of("message", "Test");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertTrue(sendMessage.containsKey(roomId));
        
        messageSenderManager.removeRoomMessageQueue(roomId);
        assertFalse(sendMessage.containsKey(roomId));
    }

    @Test
    void testMultipleRoomQueues() throws Exception {
        String roomId1 = "room-1";
        String roomId2 = "room-2";
        Map<String, Object> payload1 = Map.of("room", "1");
        Map<String, Object> payload2 = Map.of("room", "2");
        
        messageSenderManager.createRoomMessageQueue(roomId1);
        messageSenderManager.createRoomMessageQueue(roomId2);
        
        messageSenderManager.sendMessageToUser(mockSession, roomId1, payload1);
        messageSenderManager.sendMessageToUser(mockSession, roomId2, payload2);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        
        assertEquals(1, sendMessage.get(roomId1).size());
        assertEquals(1, sendMessage.get(roomId2).size());
        assertEquals("1", sendMessage.get(roomId1).peek().getPayload().get("room"));
        assertEquals("2", sendMessage.get(roomId2).peek().getPayload().get("room"));
    }

    @Test
    void testConcurrentMessageAddition() throws Exception {
        String roomId = "test-room";
        int messageCount = 100;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(3);
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        Runnable addMessages = () -> {
            try {
                startLatch.await();
                for (int i = 0; i < messageCount; i++) {
                    Map<String, Object> payload = Map.of("threadId", Thread.currentThread().getId(), "messageId", i);
                    messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
                }
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                endLatch.countDown();
            }
        };
        
        Thread thread1 = new Thread(addMessages);
        Thread thread2 = new Thread(addMessages);
        Thread thread3 = new Thread(addMessages);
        
        thread1.start();
        thread2.start();
        thread3.start();
        
        startLatch.countDown();
        assertTrue(endLatch.await(5, TimeUnit.SECONDS));
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);

        log.info(messageCount + " messages added");
        log.info(queue.size() + " messages added");
        assertEquals(messageCount * 3, queue.size());
    }

    @Test
    void testQueueReplacementOnCreate() throws Exception {
        String roomId = "test-room";
        Map<String, Object> payload = Map.of("message", "Old message");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(1, sendMessage.get(roomId).size());
        
        messageSenderManager.createRoomMessageQueue(roomId);
        assertTrue(sendMessage.get(roomId).isEmpty());
    }

    @Test
    void testDifferentMessageTypes() throws Exception {
        String roomId = "test-room";
        UserDto.Team team = UserDto.Team.RED;
        Map<String, Object> userPayload = Map.of("type", "user");
        Map<String, Object> broadcastPayload = Map.of("type", "broadcast");
        Map<String, Object> broadcastOtherPayload = Map.of("type", "broadcast_other");
        
        messageSenderManager.createRoomMessageQueue(roomId);
        messageSenderManager.sendMessageToUser(mockSession, roomId, userPayload);
        messageSenderManager.sendMessageBroadCast(mockSession, roomId, team, broadcastPayload);
        messageSenderManager.sendMessageBroadCastOther(mockSession, roomId, team, broadcastOtherPayload);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        assertEquals(3, queue.size());
        
        SendMessageDto userMsg = queue.pollFirst();
        SendMessageDto broadcastMsg = queue.pollFirst();
        SendMessageDto broadcastOtherMsg = queue.pollFirst();
        
        assertEquals(SendMessageDto.sendType.USER, userMsg.getMsgType());
        assertEquals(SendMessageDto.sendType.BROADCAST, broadcastMsg.getMsgType());
        assertEquals(SendMessageDto.sendType.BROADCAST_OTHER, broadcastOtherMsg.getMsgType());
    }

    @Test
    void testNullPayloadHandling() throws Exception {
        String roomId = "test-room";
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        assertDoesNotThrow(() -> {
            messageSenderManager.sendMessageToUser(mockSession, roomId, null);
        });
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(1, sendMessage.get(roomId).size());
        assertNull(sendMessage.get(roomId).peek().getPayload());
    }

    @Test
    void testLargeMessageQueue() throws Exception {
        String roomId = "test-room";
        int messageCount = 1000;
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        long startTime = System.nanoTime();
        for (int i = 0; i < messageCount; i++) {
            Map<String, Object> payload = Map.of("messageId", i);
            messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        }
        long endTime = System.nanoTime();
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(messageCount, sendMessage.get(roomId).size());
        
        long durationMs = (endTime - startTime) / 1_000_000;
        System.out.println("Time to add " + messageCount + " messages: " + durationMs + "ms");
        assertTrue(durationMs < 1000);
    }

    private Map<String, ArrayDeque<SendMessageDto>> getSendMessageField() throws Exception {
        Field field = MessageSenderManager.class.getDeclaredField("sendMessage");
        field.setAccessible(true);
        return (Map<String, ArrayDeque<SendMessageDto>>) field.get(messageSenderManager);
    }
}