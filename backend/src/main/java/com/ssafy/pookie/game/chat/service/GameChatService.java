package com.ssafy.pookie.game.chat.service;

import com.ssafy.pookie.game.chat.dto.ChatDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameChatService {
    private final OnlinePlayerManager onlinePlayerManager;
    // Chat
    public void handleChat(WebSocketSession session, ChatDto chatDto) throws IOException {
        chatDto.sendChat(session, onlinePlayerManager.getRooms().get(chatDto.getRoomId()));
    }
}
