package com.ssafy.pookie.game.message.manager;

import com.ssafy.pookie.game.message.dto.SendMessageDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
@Component
@Slf4j
public class MessageSenderManager {
//    private ArrayDeque<SendMessageDto> sendMessage = new ArrayDeque<>();
    private Map<String, ArrayDeque<SendMessageDto>> sendMessage = new ConcurrentHashMap<>();
    private final OnlinePlayerManager onlinePlayerManager;

    @Scheduled(fixedRate = 5)
    private void sendMessageSchedule() {
        if(sendMessage.isEmpty()) return;
        sendMessage.entrySet().forEach((messageSet) -> {
            ArrayDeque<SendMessageDto> queue = messageSet.getValue();
            SendMessageDto message = null;
            synchronized (queue) {
                if (!queue.isEmpty()) {
                    message = queue.pollFirst();
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
                } catch (Exception e) { // 전송 실패 -> 가장 우선순위로 실행
                    if (!onlinePlayerManager.isInvalid(message.getSession())) {
                        log.error("Invalid Message : \n{}\n{}", message.getSession(), message.getPayload());
                        return;
                    }
                    log.error("Message 전송 실패 : \n{}\n{}", e.getMessage(), message.getPayload());
                    log.info("재시도합니다.");
                    synchronized (queue) {
                        queue.offerFirst(message);
                    }
                }
            }
        });
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
