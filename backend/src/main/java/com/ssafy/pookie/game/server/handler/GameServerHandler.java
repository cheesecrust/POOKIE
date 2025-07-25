package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.auth.model.UserAccounts;
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

        JoinDto join;
        TurnDto gameResult;

        switch(msg.getType()) {
            case JOIN:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.handleJoin(session, join);
                break;
            case LEAVE:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.handleLeave(session, join.getRoomId());
                break;
            case TEAM_CHANGE:
                UserTeamChangeRequestDto userTeamChangeRequestDto = objectMapper.convertValue(msg.getPayload(), UserTeamChangeRequestDto.class);
                userTeamChangeRequestDto.getUser().setSession(session);
                gameService.handleUserTeamChange(session, userTeamChangeRequestDto);
                break;
            case USER_READY_CHANGE:
                UserStatusChangeDto userStatusChangeDto = objectMapper.convertValue(msg.getPayload(), UserStatusChangeDto.class);
                userStatusChangeDto.getUser().setSession(session);
                gameService.handleUserStatus(session, userStatusChangeDto);
                break;
            case FORCED_REMOVE:
                RoomMasterForcedRemovalDto roomMasterForcedRemovalDto = objectMapper.convertValue(msg.getPayload(), RoomMasterForcedRemovalDto.class);
                roomMasterForcedRemovalDto.getRoomMaster().setSession(session);
                gameService.handleForcedRemoval(session, roomMasterForcedRemovalDto);
                break;
            case GAME_START:
                join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                join.getUser().setSession(session);
                gameService.hadleGameStart(session, join);
                break;
            case TURN_CHANGE:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.getUserDto().setSession(session);
                gameService.handleTurnChange(session, gameResult);
                break;
            case ROUND_OVER:
                gameService.handleRoundOver();
                break;
            case GAME_OVER:
                break;
        }
    }

    // web socket 연결하는 순간 user를 만든다.
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());

        UserDto user = UserDto.builder()
                .session(session)
                .userAccountId((Long) session.getAttributes().get("userAccountId"))
                .userEmail((String) session.getAttributes().get("userEmail"))
                .userNickname((String) session.getAttributes().get("nickname"))
                .status(UserDto.Status.NONE)
                .grant(UserDto.Grant.NONE)
                .build();
        gameService.handleOn(session, user);

        Long userId = (Long) session.getAttributes().get("userAccountId");
        UserAccounts userAccount = userAccountsRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user account not found"));

        userAccount.updateOnline(true);
        userAccountsRepository.save(userAccount);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("[WebSocket] Disconnected : "+ session.getId());
        gameService.removeFromLobby(session);
    }
}
