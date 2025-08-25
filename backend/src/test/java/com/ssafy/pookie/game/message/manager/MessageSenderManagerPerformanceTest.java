package com.ssafy.pookie.game.message.manager;

import com.ssafy.pookie.game.message.dto.SendMessageDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.WebSocketSession;

import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MessageSenderManagerPerformanceTest {

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
    void testMessageThroughputBaseline() throws Exception {
        String roomId = "performance-room";
        int messageCount = 10000;
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        long startTime = System.nanoTime();
        for (int i = 0; i < messageCount; i++) {
            Map<String, Object> payload = Map.of(
                "messageId", i,
                "timestamp", System.currentTimeMillis(),
                "data", "Performance test message " + i
            );
            messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        }
        long endTime = System.nanoTime();
        
        double durationMs = (endTime - startTime) / 1_000_000.0;
        double messagesPerSecond = messageCount / (durationMs / 1000.0);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(messageCount, sendMessage.get(roomId).size());
        
        System.out.println("=== MessageSenderManager Baseline Performance ===");
        System.out.println("Messages added: " + messageCount);
        System.out.println("Duration: " + String.format("%.2f", durationMs) + "ms");
        System.out.println("Throughput: " + String.format("%.0f", messagesPerSecond) + " messages/sec");
        System.out.println("Average time per message: " + String.format("%.3f", durationMs / messageCount) + "ms");
        
        assertTrue(messagesPerSecond > 1000, "Baseline throughput should be at least 1000 messages/sec");
    }

    @Test
    void testConcurrentPerformance() throws Exception {
        String roomId = "concurrent-room";
        int threadsCount = 5;
        int messagesPerThread = 2000;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadsCount);
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        List<Long> threadTimes = new CopyOnWriteArrayList<>();
        
        Runnable task = () -> {
            try {
                startLatch.await();
                long threadStart = System.nanoTime();
                
                for (int i = 0; i < messagesPerThread; i++) {
                    Map<String, Object> payload = Map.of(
                        "threadId", Thread.currentThread().getId(),
                        "messageId", i,
                        "timestamp", System.currentTimeMillis()
                    );
                    messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
                }
                
                long threadEnd = System.nanoTime();
                threadTimes.add((threadEnd - threadStart) / 1_000_000);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                endLatch.countDown();
            }
        };
        
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < threadsCount; i++) {
            Thread thread = new Thread(task);
            threads.add(thread);
            thread.start();
        }
        
        long overallStart = System.nanoTime();
        startLatch.countDown();
        assertTrue(endLatch.await(10, TimeUnit.SECONDS));
        long overallEnd = System.nanoTime();
        
        double overallDurationMs = (overallEnd - overallStart) / 1_000_000.0;
        int totalMessages = threadsCount * messagesPerThread;
        double overallThroughput = totalMessages / (overallDurationMs / 1000.0);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        int actualQueueSize = sendMessage.get(roomId).size();
        
        System.out.println("=== Concurrent Performance Test ===");
        System.out.println("Threads: " + threadsCount);
        System.out.println("Messages per thread: " + messagesPerThread);
        System.out.println("Total expected messages: " + totalMessages);
        System.out.println("Actual queue size: " + actualQueueSize);
        System.out.println("Overall duration: " + String.format("%.2f", overallDurationMs) + "ms");
        System.out.println("Overall throughput: " + String.format("%.0f", overallThroughput) + " messages/sec");
        
        OptionalDouble avgThreadTime = threadTimes.stream().mapToDouble(Long::doubleValue).average();
        if (avgThreadTime.isPresent()) {
            System.out.println("Average thread time: " + String.format("%.2f", avgThreadTime.getAsDouble()) + "ms");
        }
        
        assertTrue(actualQueueSize <= totalMessages, "Queue size should not exceed total messages");
        assertTrue(overallThroughput > 500, "Concurrent throughput should be at least 500 messages/sec");
    }

    @Test
    void testMemoryUsageBaseline() throws Exception {
        String roomId = "memory-room";
        int messageCount = 50000;
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        
        for (int i = 0; i < messageCount; i++) {
            Map<String, Object> payload = Map.of(
                "messageId", i,
                "timestamp", System.currentTimeMillis(),
                "largeData", "This is a larger message payload to test memory usage patterns " + 
                           "with more realistic data sizes that might be used in production " + i
            );
            messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
        }
        
        runtime.gc();
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;
        double memoryPerMessage = (double) memoryUsed / messageCount;
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        assertEquals(messageCount, sendMessage.get(roomId).size());
        
        System.out.println("=== Memory Usage Baseline ===");
        System.out.println("Messages: " + messageCount);
        System.out.println("Memory used: " + String.format("%.2f", memoryUsed / 1024.0 / 1024.0) + " MB");
        System.out.println("Memory per message: " + String.format("%.0f", memoryPerMessage) + " bytes");
        
        assertTrue(memoryPerMessage < 10000, "Memory per message should be reasonable (< 10KB)");
    }

    @Test
    void testMultiRoomPerformance() throws Exception {
        int roomCount = 100;
        int messagesPerRoom = 100;
        
        List<String> roomIds = new ArrayList<>();
        for (int i = 0; i < roomCount; i++) {
            String roomId = "room-" + i;
            roomIds.add(roomId);
            messageSenderManager.createRoomMessageQueue(roomId);
        }
        
        long startTime = System.nanoTime();
        
        for (String roomId : roomIds) {
            for (int i = 0; i < messagesPerRoom; i++) {
                Map<String, Object> payload = Map.of(
                    "roomId", roomId,
                    "messageId", i,
                    "timestamp", System.currentTimeMillis()
                );
                messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
            }
        }
        
        long endTime = System.nanoTime();
        double durationMs = (endTime - startTime) / 1_000_000.0;
        int totalMessages = roomCount * messagesPerRoom;
        double throughput = totalMessages / (durationMs / 1000.0);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        
        System.out.println("=== Multi-Room Performance ===");
        System.out.println("Rooms: " + roomCount);
        System.out.println("Messages per room: " + messagesPerRoom);
        System.out.println("Total messages: " + totalMessages);
        System.out.println("Duration: " + String.format("%.2f", durationMs) + "ms");
        System.out.println("Throughput: " + String.format("%.0f", throughput) + " messages/sec");
        System.out.println("Active rooms in queue: " + sendMessage.size());
        
        assertEquals(roomCount, sendMessage.size());
        for (String roomId : roomIds) {
            assertEquals(messagesPerRoom, sendMessage.get(roomId).size());
        }
        
        assertTrue(throughput > 800, "Multi-room throughput should be at least 800 messages/sec");
    }

    @Test
    void testQueueOperationPerformance() throws Exception {
        String roomId = "queue-ops-room";
        int operationCount = 10000;
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        Map<String, Object> testPayload = Map.of("test", "data");
        
        long addStartTime = System.nanoTime();
        for (int i = 0; i < operationCount; i++) {
            messageSenderManager.sendMessageToUser(mockSession, roomId, testPayload);
        }
        long addEndTime = System.nanoTime();
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        long pollStartTime = System.nanoTime();
        for (int i = 0; i < operationCount; i++) {
            queue.pollFirst();
        }
        long pollEndTime = System.nanoTime();
        
        double addDurationMs = (addEndTime - addStartTime) / 1_000_000.0;
        double pollDurationMs = (pollEndTime - pollStartTime) / 1_000_000.0;
        
        System.out.println("=== Queue Operation Performance ===");
        System.out.println("Operations: " + operationCount);
        System.out.println("Add operations: " + String.format("%.2f", addDurationMs) + "ms");
        System.out.println("Poll operations: " + String.format("%.2f", pollDurationMs) + "ms");
        System.out.println("Add ops/sec: " + String.format("%.0f", operationCount / (addDurationMs / 1000.0)));
        System.out.println("Poll ops/sec: " + String.format("%.0f", operationCount / (pollDurationMs / 1000.0)));
        
        assertTrue(queue.isEmpty());
        assertTrue(addDurationMs < 1000, "Add operations should complete within 1 second");
        assertTrue(pollDurationMs < 1000, "Poll operations should complete within 1 second");
    }

    @Test
    void testMessageTypeDistributionPerformance() throws Exception {
        String roomId = "type-distribution-room";
        int messagesPerType = 3000;
        UserDto.Team team = UserDto.Team.RED;
        
        messageSenderManager.createRoomMessageQueue(roomId);
        
        Map<String, Object> payload = Map.of("test", "data");
        
        long startTime = System.nanoTime();
        
        for (int i = 0; i < messagesPerType; i++) {
            messageSenderManager.sendMessageToUser(mockSession, roomId, payload);
            messageSenderManager.sendMessageBroadCast(mockSession, roomId, team, payload);
            messageSenderManager.sendMessageBroadCastOther(mockSession, roomId, team, payload);
        }
        
        long endTime = System.nanoTime();
        double durationMs = (endTime - startTime) / 1_000_000.0;
        int totalMessages = messagesPerType * 3;
        double throughput = totalMessages / (durationMs / 1000.0);
        
        Map<String, ArrayDeque<SendMessageDto>> sendMessage = getSendMessageField();
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        
        Map<SendMessageDto.sendType, Integer> typeCounts = new HashMap<>();
        queue.forEach(msg -> typeCounts.merge(msg.getMsgType(), 1, Integer::sum));
        
        System.out.println("=== Message Type Distribution Performance ===");
        System.out.println("Messages per type: " + messagesPerType);
        System.out.println("Total messages: " + totalMessages);
        System.out.println("Duration: " + String.format("%.2f", durationMs) + "ms");
        System.out.println("Throughput: " + String.format("%.0f", throughput) + " messages/sec");
        System.out.println("Type distribution:");
        typeCounts.forEach((type, count) -> 
            System.out.println("  " + type + ": " + count + " messages"));
        
        assertEquals(totalMessages, queue.size());
        assertEquals(messagesPerType, typeCounts.get(SendMessageDto.sendType.USER).intValue());
        assertEquals(messagesPerType, typeCounts.get(SendMessageDto.sendType.BROADCAST).intValue());
        assertEquals(messagesPerType, typeCounts.get(SendMessageDto.sendType.BROADCAST_OTHER).intValue());
        
        assertTrue(throughput > 600, "Mixed message type throughput should be at least 600 messages/sec");
    }

    private Map<String, ArrayDeque<SendMessageDto>> getSendMessageField() throws Exception {
        Field field = MessageSenderManager.class.getDeclaredField("sendMessage");
        field.setAccessible(true);
        return (Map<String, ArrayDeque<SendMessageDto>>) field.get(messageSenderManager);
    }
}