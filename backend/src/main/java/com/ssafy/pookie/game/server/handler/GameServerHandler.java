package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateUpdate;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.user.dto.UserDto;
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
public class GameServerHandler extends TextWebSocketHandler {
    @Autowired
    private final GameServerService gameService;

    private final ObjectMapper objectMapper;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);
        msg.setSid(session.getId());
        switch(msg.getType()) {
            case ON:
                UserDto on = objectMapper.convertValue(msg.getPayload(), UserDto.class);
                gameService.handleOn(session, on);
                break;
            case JOIN:
                JoinDto join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                gameService.handleJoin(session, join);
                break;
            case LEAVE:
                JoinDto leave = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                gameService.handleLeave(session, leave.getRoomId());
                break;
            case STATE_UPDATE:
                RoomStateUpdate roomStateUpdate = objectMapper.convertValue(msg.getPayload(), RoomStateUpdate.class);
                gameService.handleStateUpdate(session, roomStateUpdate);
                break;
        }
    }

    // TODO 세션 연결 시, Lobby 에 추가할 수 있도록, Token 도입
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        gameService.removeFromLobby(session);
        log.info("[WebSocket] Disconnected : "+ session.getId());
    }
}
