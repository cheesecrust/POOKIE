package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.chat.dto.ChatDto;
import com.ssafy.pookie.game.chat.service.GameChatService;
import com.ssafy.pookie.game.draw.dto.DrawEvent;
import com.ssafy.pookie.game.draw.service.DrawService;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.game.ingame.dto.PainterChangeRequest;
import com.ssafy.pookie.game.ingame.dto.SubmitAnswerDto;
import com.ssafy.pookie.game.ingame.service.InGameService;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomGameTypeChangeRequestDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.room.service.GameRoomService;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.timer.dto.TimerRequestDto;
import com.ssafy.pookie.game.timer.service.GameTimerService;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.game.user.dto.UserStatusChangeDto;
import com.ssafy.pookie.game.user.dto.UserTeamChangeRequestDto;
import com.ssafy.pookie.metrics.SocketMetrics;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameServerHandler extends TextWebSocketHandler {
    private final OnlinePlayerManager onlinePlayerManager;
    private final GameServerService gameService;
    private final GameTimerService gameTimerService;
    private final GameChatService gameChatService;
    private final GameRoomService gameRoomService;
    private final InGameService inGameService;
    private final SocketMetrics socketMetrics;

    private final ObjectMapper objectMapper;
    private final DrawService drawService;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Timer.Sample messageSample = socketMetrics.startMessageProcessing();
        try {
            MessageDto msg = objectMapper.readValue(message.getPayload(), MessageDto.class);
            msg.setSid(session.getId());
            UserDto user = new UserDto().mapUserDto(session);
            JoinDto join;
            TurnDto gameResult;
            log.debug("{} Request", msg.getType());
            
            socketMetrics.recordMessageReceived(msg.getType().toString(), message.getPayload().length());
            switch (msg.getType()) {
                // Room
                case JOIN_ROOM:
                    join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                    join.setUser(user);
                    gameRoomService.handleJoin(session, join);
                    break;
                case LEAVE_ROOM:
                    join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                    join.setUser(user);
                    gameRoomService.handleLeave(session, join.getRoomId());
                    break;
                case USER_TEAM_CHANGE:
                    UserTeamChangeRequestDto userTeamChangeRequestDto = objectMapper.convertValue(msg.getPayload(), UserTeamChangeRequestDto.class);
                    userTeamChangeRequestDto.setUser(user);
                    gameRoomService.handleUserTeamChange(session, userTeamChangeRequestDto);
                    break;
                case USER_READY_CHANGE:
                    UserStatusChangeDto userStatusChangeDto = objectMapper.convertValue(msg.getPayload(), UserStatusChangeDto.class);
                    userStatusChangeDto.setUser(user);
                    gameRoomService.handleUserStatus(session, userStatusChangeDto);
                    break;
                case USER_FORCED_REMOVE:
                    RoomMasterForcedRemovalDto roomMasterForcedRemovalDto = objectMapper.convertValue(msg.getPayload(), RoomMasterForcedRemovalDto.class);
                    roomMasterForcedRemovalDto.setRoomMaster(user);
                    gameRoomService.handleForcedRemoval(session, roomMasterForcedRemovalDto);
                    break;
                case CHANGE_GAMETYPE:
                    RoomGameTypeChangeRequestDto roomGameTypeChangeRequestDto = objectMapper.convertValue(msg.getPayload(), RoomGameTypeChangeRequestDto.class);
                    roomGameTypeChangeRequestDto.setRoomMaster(user);
                    gameRoomService.handleGameTypeChange(roomGameTypeChangeRequestDto);
                    break;
                // Game
                case START_GAME:
                    GameStartDto start = objectMapper.convertValue(msg.getPayload(), GameStartDto.class);
                    start.setUser(user);
                    gameTimerService.beforeStartGameTimer(session, start);
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
                case PAINTER_CHANGE:
                    PainterChangeRequest painterChangeRequest = objectMapper.convertValue(msg.getPayload(), PainterChangeRequest.class);
                    painterChangeRequest.setUser(user);
                    inGameService.handlePainterChange(painterChangeRequest);
                    break;
                // Chat
                case CHAT:
                    ChatDto chatDto = objectMapper.convertValue(msg.getPayload(), ChatDto.class);
                    chatDto.setUser(user);
                    gameChatService.handleChat(session, chatDto);
                    break;
                // Timer
                case TIMER_START:
                    TimerRequestDto timerRequest = objectMapper.convertValue(msg.getPayload(), TimerRequestDto.class);
                    timerRequest.setUser(user);
                    gameTimerService.preTimer(timerRequest);
                    break;
                // Draw
                case DRAW:
                    DrawEvent drawEvent = objectMapper.convertValue(msg.getPayload(), DrawEvent.class);
                    drawEvent.setUser(user);
                    drawService.drawEvent(drawEvent);
                    break;
            }
            socketMetrics.endMessageProcessing(messageSample, msg.getType().toString());
        } catch(Exception e) {
            e.printStackTrace();
            socketMetrics.endMessageProcessing(messageSample, "ERROR");
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "Type", "Error",
                    "msg", "요청처리 중 문제가 발생하였습니다."
            ));
        }
    }

    // web socket 연결하는 순간 user를 만든다.
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());
        log.info(onlinePlayerManager.getLobby().size() + " Lobby Users found");
        
        socketMetrics.recordConnectionAttempt();
        Timer.Sample connectionSample = socketMetrics.startConnectionHandling();
        
        try {
            gameService.joinInLobby(session);
            socketMetrics.recordConnectionAccepted(session.getId());
            socketMetrics.endConnectionHandling(connectionSample);
        } catch (Exception e) {
            socketMetrics.recordConnectionRejected("lobby_join_failed");
            socketMetrics.endConnectionHandling(connectionSample);
            throw e;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("[WebSocket] Disconnected : "+ session.getId());
        socketMetrics.recordConnectionClosed(session.getId());
        onlinePlayerManager.removeFromLobby(session);
        log.info(onlinePlayerManager.getLobby().size() + " Lobby Users found");
    }
}
