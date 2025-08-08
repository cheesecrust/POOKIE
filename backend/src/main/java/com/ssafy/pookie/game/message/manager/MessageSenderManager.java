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
import java.util.Map;

@RequiredArgsConstructor
@Component
@Slf4j
public class MessageSenderManager {
    private ArrayDeque<SendMessageDto> sendMessage = new ArrayDeque<>();
    private final OnlinePlayerManager onlinePlayerManager;

    @Scheduled(fixedDelay = 10)
    private void sendMessageSchedule() {
        if(sendMessage.isEmpty()) return;
        log.info("Message Flush");
        SendMessageDto message = sendMessage.poll();
        try {
            if (message.getMsgType().equals(SendMessageDto.sendType.BROADCAST)) {
                onlinePlayerManager.broadCastMessageToRoomUser(message.getSession(), message.getRoomId(),
                        message.getTeam() == null ? null : message.getTeam().toString(), message.getPayload());
            } else {
                onlinePlayerManager.sendToMessageUser(message.getSession(), message.getPayload());
            }
            log.info("Message 전송 완료 : \n{}", message.getPayload());
        } catch (IllegalArgumentException e) {
          log.error("Invalid Message : ", e.getMessage());
        } catch (Exception e) { // 전송 실패 -> 가장 우선순위로 실행
            log.error("Message 전송 실패 : \n{}\n{}", e.getMessage(), message.getPayload());
            sendMessage.offerFirst(message);
        }
    }

    public void sendMessageToUser(WebSocketSession session, Map<String, Object> payload) {
        SendMessageDto sendMessageReq = SendMessageDto.builder()
                .session(session)
                .msgType(SendMessageDto.sendType.USER)
                .payload(payload).build();

        this.sendMessage.offerLast(sendMessageReq);
    }

    public void sendMessageBroadCast(WebSocketSession session, String roomId, UserDto.Team team, Map<String, Object> payload) {
        SendMessageDto sendMessageReq = SendMessageDto.builder()
                .session(session)
                .msgType(SendMessageDto.sendType.BROADCAST)
                .roomId(roomId)
                .team(team)
                .payload(payload).build();

        this.sendMessage.offerLast(sendMessageReq);
    }
}
