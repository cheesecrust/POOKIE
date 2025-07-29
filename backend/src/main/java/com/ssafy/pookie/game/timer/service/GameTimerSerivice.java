package com.ssafy.pookie.game.timer.service;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.timer.dto.GameTimerDto;
import com.ssafy.pookie.game.timer.dto.TimerRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameTimerSerivice {
    private final OnlinePlayerManager onlinePlayerManager;

    public void handleStartTimer(TimerRequestDto timerRequest) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(timerRequest.getRoomId());
        if(!isAuthorized(timerRequest.getUser().getSession(), room) || room.getStatus() == RoomStateDto.Status.START) {
            onlinePlayerManager.sendToMessageUser(timerRequest.getUser().getSession(), Map.of(
                    "type", "ERROR",
                    "msg", "요청이 잘못되었습니다."
            ));
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
                                        "time", timeLeft
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
                                        "type", "TIMER_END",
                                        "msg", "시간이 종료되었습니다."
                                )
                        );
                        scheduler.shutdown();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
        );
        // Room 에 타이머 설정
        room.setTimer(timer);
        // 요청 시간만큼 시작
        timer.start(timerRequest.getSec());
    }

    public boolean isAuthorized(WebSocketSession session, RoomStateDto room) {
        /*
            현재 요청자가 방에 포함되어 있는지
            방장이 맞는지 확인
         */
        return room.getSessions().contains(session)
                && room.getRoomMaster().getSession() == session;
    }
}
