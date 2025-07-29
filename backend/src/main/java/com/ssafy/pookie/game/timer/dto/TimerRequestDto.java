package com.ssafy.pookie.game.timer.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class TimerRequestDto {
    private UserDto user;   // request User

    private String roomId;  // roomID
    private Integer sec;    // 게임 시간 ( 요청 시간 )
}
