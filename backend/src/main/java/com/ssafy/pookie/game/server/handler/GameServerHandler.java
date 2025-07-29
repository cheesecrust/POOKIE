package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.chat.dto.ChatDto;
import com.ssafy.pookie.game.chat.service.GameChatService;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.game.ingame.dto.SubmitAnswerDto;
import com.ssafy.pookie.game.ingame.service.InGameService;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.room.service.GameRoomService;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.timer.dto.TimerRequestDto;
import com.ssafy.pookie.game.timer.service.GameTimerService;
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
    private final GameTimerService gameTimerService;
    private final GameChatService gameChatService;
    private final GameRoomService gameRoomService;
    private final InGameService inGameService;

    private final ObjectMapper objectMapper;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);
        msg.setSid(session.getId());
        UserDto user = new UserDto().mapUserDto(session);
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
                inGameService.hadleGameStart(session, start);
                break;
            case TURN_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.setUser(user);
                inGameService.handleTurnChange(session, gameResult);
                break;
            case ROUND_OVER:
                gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                gameResult.setUser(user);
                inGameService.handleRoundOver(session, gameResult);
                break;
            case SUBMIT_ANSWER:
                SubmitAnswerDto submitAnswer = objectMapper.convertValue(msg.getPayload(), SubmitAnswerDto.class);
                submitAnswer.setUser(user);
                inGameService.handleSubmitAnswer(submitAnswer);
                break;
//            case GAME_OVER:
//                break;
            // Chat
            case CHAT:
                ChatDto chatDto = objectMapper.convertValue(msg.getPayload(), ChatDto.class);
                chatDto.setUser(user);
                gameChatService.handleChat(session, chatDto);
                break;
            // Timer
            case TIMER_START :
                TimerRequestDto timerRequest = objectMapper.convertValue(msg.getPayload(), TimerRequestDto.class);
                timerRequest.setUser(user);
                gameTimerService.handleStartTimer(timerRequest);
                break;
        }
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
