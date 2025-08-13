package com.ssafy.pookie.game.server.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.chat.dto.ChatDto;
import com.ssafy.pookie.game.chat.service.GameChatService;
import com.ssafy.pookie.game.draw.dto.DrawEvent;
import com.ssafy.pookie.game.draw.service.DrawService;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.game.ingame.dto.PainterChangeRequest;
import com.ssafy.pookie.game.ingame.dto.PassRequestDto;
import com.ssafy.pookie.game.ingame.dto.SubmitAnswerDto;
import com.ssafy.pookie.game.ingame.service.InGameService;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.mini.dto.MiniGameLeaveRequestDto;
import com.ssafy.pookie.game.mini.dto.MiniGameOverRequestDto;
import com.ssafy.pookie.game.mini.dto.MiniGameRoomDto;
import com.ssafy.pookie.game.mini.dto.MiniGameScoreUpdateRequestDto;
import com.ssafy.pookie.game.mini.service.MiniGameService;
import com.ssafy.pookie.game.room.dto.*;
import com.ssafy.pookie.game.room.service.FollowService;
import com.ssafy.pookie.game.room.service.GameRoomService;
import com.ssafy.pookie.game.room.service.InviteService;
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
    private final MiniGameService miniGameService;
    private final InviteService inviteService;
    private final FollowService followService;
    private final SocketMetrics socketMetrics;
    private final MessageSenderManager messageSenderManager;

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
            if(!(msg.getType().equals(MessageDto.Type.GAME_DRAW) || msg.getType().equals(MessageDto.Type.GAME_DRAW_EVENT))) {
                log.info("REQUEST TYPE : {}", msg.getType());
                log.info("payload\nSession : {}\n{}", session.getAttributes().get("userEmail"), msg.getPayload());
            }
            socketMetrics.recordMessageReceived(msg.getType().toString(), message.getPayload().length());
            switch (msg.getType()) {
                // Room
                case ROOM_JOIN:
                    join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                    join.setUser(user);
                    gameRoomService.handleJoin(session, join);
                    break;
                case WAITING_USER_LEAVE:
                    join = objectMapper.convertValue(msg.getPayload(), JoinDto.class);
                    join.setUser(user);
                    gameRoomService.handleLeave(session, join.getRoomId(), false);
                    break;
                case WAITING_TEAM_CHANGE:
                    UserTeamChangeRequestDto userTeamChangeRequestDto = objectMapper.convertValue(msg.getPayload(), UserTeamChangeRequestDto.class);
                    userTeamChangeRequestDto.setUser(user);
                    gameRoomService.handleUserTeamChange(session, userTeamChangeRequestDto);
                    break;
                case WAITING_READY_CHANGE:
                    UserStatusChangeDto userStatusChangeDto = objectMapper.convertValue(msg.getPayload(), UserStatusChangeDto.class);
                    userStatusChangeDto.setUser(user);
                    gameRoomService.handleUserStatus(session, userStatusChangeDto);
                    break;
                case WAITING_USER_REMOVE:
                    RoomMasterForcedRemovalDto roomMasterForcedRemovalDto = objectMapper.convertValue(msg.getPayload(), RoomMasterForcedRemovalDto.class);
                    roomMasterForcedRemovalDto.setRoomMaster(user);
                    gameRoomService.handleForcedRemoval(session, roomMasterForcedRemovalDto);
                    break;
                case WAITING_GAMETYPE_CHANGE:
                    RoomGameTypeChangeRequestDto roomGameTypeChangeRequestDto = objectMapper.convertValue(msg.getPayload(), RoomGameTypeChangeRequestDto.class);
                    roomGameTypeChangeRequestDto.setRoomMaster(user);
                    gameRoomService.handleGameTypeChange(roomGameTypeChangeRequestDto);
                    break;
                // Game
                case WAITING_GAME_START:
                    GameStartDto start = objectMapper.convertValue(msg.getPayload(), GameStartDto.class);
                    start.setUser(user);
//                    gameTimerService.beforeStartGameTimer(session, start);
                    inGameService.handleGameStart(session, start);
                    break;
                case WAITING_ROOM_UPDATE:
                    RoomUpdateRequestDto roomUpdateRequest = objectMapper.convertValue(msg.getPayload(), RoomUpdateRequestDto.class);
                    roomUpdateRequest.setUser(user);
                    gameRoomService.handleWaitingRoomUpdate(roomUpdateRequest);
                    break;
                case GAME_TURN_OVER:
                    gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                    gameResult.setUser(user);
                    inGameService.handleTurnChange(session, gameResult);
                    break;
                case GAME_ROUND_OVER:
                    gameResult = objectMapper.convertValue(msg.getPayload(), TurnDto.class);
                    gameResult.setUser(user);
                    inGameService.handleRoundOver(session, gameResult);
                    break;
                case GAME_ANSWER_SUBMIT:
                    SubmitAnswerDto submitAnswer = objectMapper.convertValue(msg.getPayload(), SubmitAnswerDto.class);
                    submitAnswer.setUser(user);
                    inGameService.handleSubmitAnswer(submitAnswer);
                    break;
                case GAME_PAINTER_CHANGE:
                    PainterChangeRequest painterChangeRequest = objectMapper.convertValue(msg.getPayload(), PainterChangeRequest.class);
                    painterChangeRequest.setUser(user);
                    inGameService.handlePainterChange(painterChangeRequest);
                    break;
                case GAME_PASS:
                    PassRequestDto requestDto = objectMapper.convertValue(msg.getPayload(), PassRequestDto.class);
                    requestDto.setRequestUser(user);
                    inGameService.handlePass(requestDto);
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
                    gameTimerService.gameStartTimer(onlinePlayerManager.getRooms()
                                    .get(timerRequest.getRoomId()), timerRequest);
                    break;
                // Draw
                case GAME_DRAW:
                    DrawEvent drawEvent = objectMapper.convertValue(msg.getPayload(), DrawEvent.class);
                    drawEvent.setUser(user);
                    drawService.drawEvent(drawEvent);
                    break;
                case MINIGAME_JOIN:
                    // 미니 게임은 별도로 처리
                    miniGameService.handleJoinMiniGameRoom(new MiniGameRoomDto(user));
                    break;
                case MINIGAME_SCORE_UPDATE:
                    MiniGameScoreUpdateRequestDto miniGameScoreUpdateRequestDto
                            = objectMapper.convertValue(msg.getPayload(), MiniGameScoreUpdateRequestDto.class);
                    miniGameScoreUpdateRequestDto.setUser(user);
                    miniGameService.handleUpdateMiniGameScore(miniGameScoreUpdateRequestDto);
                    break;
                case MINIGAME_OVER:
                    MiniGameOverRequestDto miniGameOverRequestDto
                            = objectMapper.convertValue(msg.getPayload(), MiniGameOverRequestDto.class);
                    miniGameOverRequestDto.setUser(user);
                    miniGameService.handleMiniGameOver(miniGameOverRequestDto);
                    break;
                case MINIGAME_REGAME:
                    miniGameService.handleMiniGameRegame(user);
                    break;
                case MINIGAME_LEAVE:
                    miniGameService.handleMiniGameLeave(new MiniGameLeaveRequestDto(user));
                    break;
                case INVITE:
                    InviteRequestDto inviteRequestDto = objectMapper.convertValue(msg.getPayload(), InviteRequestDto.class);
                    inviteRequestDto.setUser(user);
                    inviteService.handleInvite(inviteRequestDto);
                    break;
                case FOLLOW:
                    FollowRequestDto followRequestDto = objectMapper.convertValue(msg.getPayload(), FollowRequestDto.class);
                    followRequestDto.setUser(user);
                    followService.handleFollow(followRequestDto);
                    break;
            }
            socketMetrics.endMessageProcessing(messageSample, msg.getType().toString());
        } catch(Exception e) {
            log.error("{}",e.getMessage());
            socketMetrics.endMessageProcessing(messageSample, "ERROR");
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", "Error",
                    "msg", "요청처리 중 문제가 발생하였습니다."
            ));
        }
    }

    // web socket 연결하는 순간 user를 만든다.
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[WebSocket] Conncted : "+ session.getId());

        socketMetrics.recordConnectionAttempt();
        Timer.Sample connectionSample = socketMetrics.startConnectionHandling();
        try {
            gameService.joinInLobby(session);
            socketMetrics.recordConnectionAccepted(session.getId());
            socketMetrics.endConnectionHandling(connectionSample);
            log.info(onlinePlayerManager.getLobby().size() + " Lobby Users found");
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
        onlinePlayerManager.removeMiniGameRoom((Long) session.getAttributes().get("userAccountId"));
        log.info(onlinePlayerManager.getLobby().size() + " Lobby Users found");
    }
}
