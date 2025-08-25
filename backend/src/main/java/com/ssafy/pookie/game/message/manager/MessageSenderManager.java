package com.ssafy.pookie.game.message.manager;

import com.ssafy.pookie.game.message.dto.SendMessageDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@RequiredArgsConstructor
@Component
@Slf4j
public class MessageSenderManager {
    private Map<String, ArrayDeque<SendMessageDto>> sendMessage = new ConcurrentHashMap<>();
    private Thread senderThread;
    private volatile boolean running = false;
    private final OnlinePlayerManager onlinePlayerManager;

    @PostConstruct
    private void startSenderThread() {
        running = true;
        senderThread = new Thread(this::sendMessageLoop, "MessageSender");
        senderThread.start();
        log.info("메시지 송신 스레드가 시작되었습니다.");
    }

    @PreDestroy
    private void stopSenderThread() {
        running = false;
        if (senderThread != null) {
            senderThread.interrupt();
            try {
                senderThread.join(5000); // 5초 대기
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        log.info("메시지 송신 스레드가 종료되었습니다.");
    }

    private void sendMessageLoop() {
        while (running) {
            try {
                boolean hasMessage = false;
                
                // 모든 룸의 큐를 확인하여 메시지 처리
                for (Map.Entry<String, ArrayDeque<SendMessageDto>> messageSet : sendMessage.entrySet()) {
                    ArrayDeque<SendMessageDto> queue = messageSet.getValue();
                    SendMessageDto message = null;
                    
                    synchronized (queue) {
                        if (!queue.isEmpty()) {
                            message = queue.pollFirst();
                            hasMessage = true;
                        }
                    }
                    
                    if (message != null) {
                        try {
                            if (message.getMsgType().equals(SendMessageDto.sendType.BROADCAST)) {
                                onlinePlayerManager.broadCastMessageToRoomUser(message.getSession(), message.getRoomId(),
                                        message.getTeam() == null ? null : message.getTeam().toString(), message.getPayload());
                            } else if (message.getMsgType().equals(SendMessageDto.sendType.BROADCAST_OTHER)) {
                                onlinePlayerManager.broadCastMessageToOtherRoomUser(message.getSession(), message.getRoomId(),
                                        message.getTeam() == null ? null : message.getTeam().toString(), message.getPayload());
                            } else {
                                onlinePlayerManager.sendToMessageUser(message.getSession(), message.getPayload());
                            }
                        } catch (Exception e) { // 전송 실패 -> 재시도
                            if (onlinePlayerManager.isInvalid(message.getSession())) {
                                log.error("Invalid session, dropping message: {}", message.getPayload());
                                continue;
                            }
                            
                            if (message.canRetry()) {
                                message.incrementRetry();
                                log.warn("Message 전송 실패, 재시도 {}/{}: {}", 
                                        message.getRetryCount(), 3, e.getMessage());
                                synchronized (queue) {
                                    queue.offerFirst(message);
                                }
                                // 재시도 간격 추가
                                Thread.sleep(100 * message.getRetryCount()); // 100ms, 200ms, 300ms
                            } else {
                                log.error("Message 최대 재시도 횟수 초과, 포기: {}", message.getPayload());
                            }
                        }
                    }
                }
                
                // 처리할 메시지가 없으면 잠시 대기 (CPU 사용량 절약)
                if (!hasMessage) {
                    Thread.sleep(1);
                }
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    public void sendMessageToUser(WebSocketSession session, String roomId,Map<String, Object> payload) {
        SendMessageDto sendMessageReq = SendMessageDto.builder()
                .session(session)
                .msgType(SendMessageDto.sendType.USER)
                .payload(payload).build();

        ArrayDeque<SendMessageDto> queue = this.sendMessage.get(roomId);
        synchronized (queue) {
            queue.offerLast(sendMessageReq);
        }
    }

    public void sendMessageBroadCast(WebSocketSession session, String roomId, UserDto.Team team, Map<String, Object> payload) {
        SendMessageDto sendMessageReq = SendMessageDto.builder()
                .session(session)
                .msgType(SendMessageDto.sendType.BROADCAST)
                .roomId(roomId)
                .team(team)
                .payload(payload).build();

        ArrayDeque<SendMessageDto> queue = this.sendMessage.get(roomId);
        synchronized (queue) {
            queue.offerLast(sendMessageReq);
        }
    }

    public void sendMessageBroadCastOther(WebSocketSession session, String roomId, UserDto.Team team, Map<String, Object> payload) {
        SendMessageDto sendMessageReq = SendMessageDto.builder()
                .session(session)
                .msgType(SendMessageDto.sendType.BROADCAST_OTHER)
                .roomId(roomId)
                .team(team)
                .payload(payload).build();

        ArrayDeque<SendMessageDto> queue = this.sendMessage.get(roomId);
        synchronized (queue) {
            queue.offerLast(sendMessageReq);
        }
    }

    public void createRoomMessageQueue(String roomId) {
        // 기존 메시지 큐는 강제로 삭제 -> 삭제가 안되어있는 경우
        sendMessage.put(roomId, new ArrayDeque<>());
    }

    public void clearRoomMessageQueue(String roomId) {
        // 채팅이 전송되지 않을 위험이 있음
        ArrayDeque<SendMessageDto> queue = sendMessage.get(roomId);
        if (queue != null) {
            synchronized (queue) {
                queue.clear();
            }
        }
    }

    public void removeRoomMessageQueue(String roomId) {
        clearRoomMessageQueue(roomId);
        sendMessage.remove(roomId);
    }
}
