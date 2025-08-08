package com.ssafy.pookie.game.chat.service;

import com.ssafy.pookie.game.chat.dto.ChatDto;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameChatService {
    private final OnlinePlayerManager onlinePlayerManager;
    // Chat
    public void handleChat(WebSocketSession session, ChatDto chatDto) throws IOException {
        log.info("CHAT REQUEST : ROOM {}", chatDto.getRoomId());
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(chatDto.getRoomId());
            if(!onlinePlayerManager.isAuthorized(session, room)) {
                log.info("CHAT ERROR");
                throw new IllegalArgumentException("잘못된 요청입니다.");
            }
            chatDto.sendChat(session, room);
        } catch(IllegalArgumentException e) {
            log.error("{}",e.getMessage());
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", MessageDto.Type.ERROR,
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw new RuntimeException();
        }
    }
}
