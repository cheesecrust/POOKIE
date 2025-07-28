package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.chat.ChatDto;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
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
    private final UserAccountsRepository userAccountsRepository;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);
        msg.setSid(session.getId());
        UserDto user = mappingUser(session);
        JoinDto join;
        TurnDto gameResult;

        switch(msg.getType()) {
            // Room
            case JOIN_ROOM:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.setUser(user);
                gameService.handleJoin(session, join);
                break;
            case LEAVE_ROOM:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.setUser(user);
                gameService.handleLeave(session, join.getRoomId());
                break;
            case USER_TEAM_CHANGE:
                UserTeamChangeRequestDto userTeamChangeRequestDto = objectMapper.convertValue(msg.getPayload(), UserTeamChangeRequestDto.class);
                userTeamChangeRequestDto.setUser(user);
                gameService.handleUserTeamChange(session, userTeamChangeRequestDto);
                break;
            case USER_READY_CHANGE:
                UserStatusChangeDto userStatusChangeDto = objectMapper.convertValue(msg.getPayload(), UserStatusChangeDto.class);
                userStatusChangeDto.setUser(user);
                gameService.handleUserStatus(session, userStatusChangeDto);
                break;
            case USER_FORCED_REMOVE:
                RoomMasterForcedRemovalDto roomMasterForcedRemovalDto = objectMapper.convertValue(msg.getPayload(), RoomMasterForcedRemovalDto.class);
                roomMasterForcedRemovalDto.setRoomMaster(user);
                gameService.handleForcedRemoval(session, roomMasterForcedRemovalDto);
                break;
            // Game
            case START_GAME:
                GameStartDto start = objectMapper.convertValue(msg.getPayload(), GameStartDto.class);
                start.setUser(user);
                gameService.hadleGameStart(session, start);
                break;
            case TURN_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.setUser(user);
                gameService.handleTurnChange(session, gameResult);
                break;
            case ROUND_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.setUser(user);
                gameService.handleRoundOver(session, gameResult);
                break;
            case GAME_OVER:
                break;
            // Chat
            case CHAT:
                ChatDto chatDto = objectMapper.convertValue(msg.getPayload(), ChatDto.class);
                chatDto.setUser(user);
                gameService.handleChat(session, chatDto);
                break;
        }
    }

    // Token 으로 user 정보 Mapping
    private UserDto mappingUser(WebSocketSession session) {
        return new UserDto(
                session,
                (Long) session.getAttributes().get("userAccountId"),
                (String) session.getAttributes().get("userEmail"),
                (String) session.getAttributes().get("nickname")
        );
    }

    // web socket 연결하는 순간 user를 만든다.
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());
        gameService.joinInLobby(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("[WebSocket] Disconnected : "+ session.getId());
        gameService.removeFromLobby(session);
    }
}
