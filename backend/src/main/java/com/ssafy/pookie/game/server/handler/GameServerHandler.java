package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.game.user.dto.UserStatusChangeDto;
import com.ssafy.pookie.game.user.dto.UserTeamChangeRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameServerHandler extends TextWebSocketHandler {

    private final GameServerService gameService;
    private final ObjectMapper objectMapper;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);
        msg.setSid(session.getId());

        JoinDto join;
        TurnDto gameResult;

        switch(msg.getType()) {
            // Lobby
            case ON:
                UserDto on = objectMapper.convertValue(msg.getPayload(), UserDto.class);
                on.setSession(session);
                gameService.handleOn(session, on);
                break;
            // Room
            case JOIN_ROOM:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.handleJoin(session, join);
                break;
            case LEAVE_ROOM:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.handleLeave(session, join.getRoomId());
                break;
            case USER_TEAM_CHANGE:
                UserTeamChangeRequestDto userTeamChangeRequestDto = objectMapper.convertValue(msg.getPayload(), UserTeamChangeRequestDto.class);
                userTeamChangeRequestDto.getUser().setSession(session);
                gameService.handleUserTeamChange(session, userTeamChangeRequestDto);
                break;
            case USER_READY_CHANGE:
                UserStatusChangeDto userStatusChangeDto = objectMapper.convertValue(msg.getPayload(), UserStatusChangeDto.class);
                userStatusChangeDto.getUser().setSession(session);
                gameService.handleUserStatus(session, userStatusChangeDto);
                break;
            case USER_FORCED_REMOVE:
                RoomMasterForcedRemovalDto roomMasterForcedRemovalDto = objectMapper.convertValue(msg.getPayload(), RoomMasterForcedRemovalDto.class);
                roomMasterForcedRemovalDto.getRoomMaster().setSession(session);
                gameService.handleForcedRemoval(session, roomMasterForcedRemovalDto);
                break;
            // Game
            case START_GAME:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.hadleGameStart(session, join);
                break;
            case TURN_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.getUser().setSession(session);
                gameService.handleTurnChange(session, gameResult);
                break;
            case ROUND_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.getUser().setSession(session);
                gameService.handleRoundOver(session, gameResult);
                break;
            case GAME_OVER:
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
