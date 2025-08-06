package com.ssafy.pookie.game.timer.service;

import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.game.ingame.service.InGameService;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.timer.dto.GameTimerDto;
import com.ssafy.pookie.game.timer.dto.TimerRequestDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameTimerService {
    private final OnlinePlayerManager onlinePlayerManager;
    private final InGameService inGameService;

    public void gameStartTimer(RoomStateDto room, TimerRequestDto timerRequest) throws IOException {
        // 새로운 Scheduler 생성
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        // 타이머 인스턴스 생성
        GameTimerDto timer = new GameTimerDto(
                scheduler,
                timeLeft -> {
                // 매 초마다 Room 에 타이머 전송 ( ALL )
                    try {
                        onlinePlayerManager.broadCastMessageToRoomUser(
                                timerRequest.getUser().getSession(),
                                timerRequest.getRoomId(),
                                null,
                                Map.of(
                                        "type", "TIMER",
                                        "time", timeLeft+1  // 시간 보정
                                ));
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                },
                () -> {
                  // 타이머 종료 시 Room 에 종료 알림 ( ALL )
                    try {
                        onlinePlayerManager.broadCastMessageToRoomUser(
                                timerRequest.getUser().getSession(),
                                timerRequest.getRoomId(),
                                null,
                                Map.of(
                                        "type", "GAME_TIMER_END",
                                        "msg", "시간이 종료되었습니다."
                                )
                        );
                        scheduler.shutdown();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
        );
        onlinePlayerManager.broadCastMessageToRoomUser(timerRequest.getUser().getSession(), room.getRoomId(), null, Map.of(
                "type", "GAME_TIMER_START"
        ));
        // Room 에 타이머 설정
        room.setTimer(timer);
        // 요청 시간만큼 시작
        timer.start(room.getGameType());
    }

    public void preTimer(TimerRequestDto timerRequest) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(timerRequest.getRoomId());
        if(!isAuthorized(timerRequest.getUser().getSession(), room) || room.getStatus() != RoomStateDto.Status.START) {
            onlinePlayerManager.sendToMessageUser(timerRequest.getUser().getSession(), Map.of(
                    "type", "ERROR",
                    "msg", "요청이 잘못되었습니다."
            ));
            return;
        }
        // 새로운 Scheduler 생성
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        // 타이머 인스턴스 생성
        GameTimerDto timer = new GameTimerDto(
                scheduler,
                timeLeft -> {
                    // 매 초마다 Room 에 타이머 전송 ( ALL )
                    try {
                        onlinePlayerManager.broadCastMessageToRoomUser(
                                timerRequest.getUser().getSession(),
                                timerRequest.getRoomId(),
                                null,
                                Map.of(
                                        "type", "TIMER",
                                        "time", timeLeft+1  // 시간 보정
                                ));
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                },
                () -> {
                    // 타이머 종료 시 Room 에 종료 알림 ( ALL )
                    try {
                        onlinePlayerManager.broadCastMessageToRoomUser(
                                timerRequest.getUser().getSession(),
                                timerRequest.getRoomId(),
                                null,
                                Map.of(
                                        "type", "TIMER_PREPARE_END",
                                        "msg", "시간이 종료되었습니다."
                                )
                        );
                        scheduler.shutdown();
                        Thread.sleep(1000*1);
                        gameStartTimer(room, timerRequest);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
        );
        onlinePlayerManager.broadCastMessageToRoomUser(timerRequest.getUser().getSession(), room.getRoomId(), null, Map.of(
                "type", "TIMER_PREPARE_START"
        ));
        // Room 에 타이머 설정
        room.setTimer(timer);
        // 요청 시간만큼 시작
        timer.start(null);
    }

    public void beforeStartGameTimer(WebSocketSession session, GameStartDto timerRequest) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(timerRequest.getRoomId());
            // 방이 존재하지 않음, 또는 해당 방에 있는 참가자가 아님, 방장이 아님
            if (!onlinePlayerManager.isAuthorized(session, room) || !onlinePlayerManager.isMaster(session, room)) new IllegalArgumentException("잘못된 요청입니다.");
            // 1. 방 인원이 모드 채워졌는지
            if (room.getSessions().size() < 6) throw new IllegalArgumentException("6명 이상 모여야 시작 가능합니다.");
            if (room.getSessions().size() == 6) {
                // 모두 준비 완료 상태인지
                int readyUserCnt = 0;
                List<UserDto> teamUsers = room.getUsers().get("RED");

                int redTeamCnt = teamUsers.size();
                readyUserCnt += (int) teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();

                teamUsers = room.getUsers().get("BLUE");
                int blueTeamCnt = teamUsers.size();
                readyUserCnt += (int) teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();

                if (redTeamCnt != blueTeamCnt) throw new IllegalArgumentException("팀원이 맞지 않습니다.");
                log.info("Room {}, 총인원 : {}, 준비완료 : {}", room.getRoomTitle(), room.getSessions().size(), readyUserCnt);
                room.setStatus(RoomStateDto.Status.READY);
                if (readyUserCnt != room.getSessions().size()) throw new IllegalArgumentException("준비완료가 되지 않았습니다.");
            }
            if (!isAuthorized(timerRequest.getUser().getSession(), room) || room.getStatus() == RoomStateDto.Status.WAITING
                    || room.getRound() > 0) {
                throw new IllegalArgumentException("잘못된 요청입니다.");
            }

            inGameService.handleGameStart(session, timerRequest);

            // 새로운 Scheduler 생성
            ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
            // 타이머 인스턴스 생성
            GameTimerDto timer = new GameTimerDto(
                    scheduler,
                    timeLeft -> {
                        // 매 초마다 Room 에 타이머 전송 ( ALL )
                        try {
                            onlinePlayerManager.broadCastMessageToRoomUser(
                                    timerRequest.getUser().getSession(),
                                    timerRequest.getRoomId(),
                                    null,
                                    Map.of(
                                            "type", "TIMER",
                                            "time", timeLeft + 1  // 시간 보정
                                    ));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    },
                    () -> {
                        // 타이머 종료 시 Room 에 종료 알림 ( ALL )
                        try {
                            onlinePlayerManager.broadCastMessageToRoomUser(
                                    timerRequest.getUser().getSession(),
                                    timerRequest.getRoomId(),
                                    null,
                                    Map.of(
                                            "type", "TIMER_PREPARE_END",
                                            "msg", "시간이 종료되었습니다."
                                    )
                            );
                            scheduler.shutdown();
                            Thread.sleep(1000 * 1);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
            );

            onlinePlayerManager.broadCastMessageToRoomUser(timerRequest.getUser().getSession(), room.getRoomId(), null, Map.of(
                    "type", "TIMER_PREPARE_START"
            ));
            // Room 에 타이머 설정
            room.setTimer(timer);
            // 요청 시간만큼 시작
            timer.start(null);
        } catch (IllegalArgumentException e) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        }
    }

    public boolean isAuthorized(WebSocketSession session, RoomStateDto room) {
        /*
            존재하는 방인지
            현재 요청자가 방에 포함되어 있는지
            방장이 맞는지 확인
         */
        return room != null && room.getSessions().contains(session)
                && room.getRoomMaster().getSession() == session;
    }
}
