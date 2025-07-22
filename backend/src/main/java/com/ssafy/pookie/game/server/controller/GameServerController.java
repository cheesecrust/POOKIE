package com.ssafy.pookie.game.server.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateUpdate;
import com.ssafy.pookie.game.server.service.GameServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameServerController extends TextWebSocketHandler {
    @Autowired
    private final GameServerService gameService;

    private final ObjectMapper objectMapper;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);

        switch(msg.getType()) {
            case JOIN:
                JoinDto join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                gameService.handleJoin(session, join);
                break;
            case STATE_UPDATE:
                RoomStateUpdate roomStateUpdate = objectMapper.convertValue(msg.getPayload(), RoomStateUpdate.class);
                gameService.handleStateUpdate(session, roomStateUpdate);
                break;
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("[WebSocket] Disconnected : "+ session.getId());
    }
}
