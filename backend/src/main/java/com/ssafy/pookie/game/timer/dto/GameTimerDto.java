package com.ssafy.pookie.game.timer.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;

import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

public class GameTimerDto {
    private final Map<RoomStateDto.GameType, Integer> runTime = Map.of(
            RoomStateDto.GameType.SILENTSCREAM, 30,
            RoomStateDto.GameType.SAMEPOSE, 5,
            RoomStateDto.GameType.SKETCHRELAY, 10
    );

    private final ScheduledExecutorService scheduler;       // 비동기 작업 예약을 실행 가능한 스케줄러 스레드 풀
    private ScheduledFuture<?> scheduledTask;               // 실행 중인 타이머 작업을 참조
    private final AtomicInteger timeLeft;                   // 스레드 안전한 정수형 객체
    private final Consumer<Integer> onTick;                 // 매 초마다 실행할 콜백
    private final Runnable onFinish;                        // 타이머 종료시 실행할 콜백

    public GameTimerDto(ScheduledExecutorService scheduler, Consumer<Integer> onTick, Runnable onFinish) {
        this.scheduler = scheduler;
        this.onTick = onTick;
        this.onFinish = onFinish;
        this.timeLeft = new AtomicInteger();
    }

    public void start(RoomStateDto.GameType gameType) {
        stop();     // 이전 타이머 정지

        timeLeft.set(runTime.get(gameType));  // 시간 설정

        scheduledTask = scheduler.scheduleAtFixedRate(() -> {
            /*
                1초씩 감소시키며 남은 시간을 브로드캐스트
             */
            int t = timeLeft.decrementAndGet();

            if(t >= 0) onTick.accept(t);
            if(t <= 0) { stop(); onFinish.run(); }
        }, 0, 1, TimeUnit.SECONDS);
    }

    public void stop() {    // 현재 실행중인 타이머가 있다면 중지
        if(scheduledTask != null && !scheduledTask.isCancelled()) scheduledTask.cancel(false);
    }

    public boolean isRunning() { return scheduledTask != null && !scheduledTask.isCancelled(); }

    public int getTimeLeft() { return timeLeft.get(); }
}
