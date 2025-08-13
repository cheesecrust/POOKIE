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

    public void gameStartTimer(RoomStateDto room, TimerRequestDto timerRequest) throws IOException {
        log.info("TIMER START REQUEST : ROOM {}", room.getRoomId());
        if(!onlinePlayerManager.isAuthorized(timerRequest.getUser().getSession(), room) || !onlinePlayerManager.isMaster(timerRequest.getUser().getSession(), room)) {
            onlinePlayerManager.sendToMessageUser(timerRequest.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", "잘못된 요청입니다."
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
                                        "time", timeLeft  // 시간 보정
                                ));
                    } catch (IOException e) {
                        log.error("{}", e.getMessage());
                    } catch (Exception e) {
                        log.error("{}", e.getMessage());
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
                        log.info("TIMER END SUCCESS : ROOM {}", room.getRoomId());
                    } catch (IOException e) {
                        log.error("TIMER START FAIL : ROOM {}", room.getRoomId());
                        log.error("REASON : {}", e.getMessage());
                    } catch (Exception e) {
                        log.error("TIMER START FAIL : ROOM {}", room.getRoomId());
                        log.error("REASON : {}", e.getMessage());
                    } finally {
                        scheduler.shutdown();
                        log.info("TIMER SHUTDOWN : ROOM {}", room.getRoomId());
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
}
