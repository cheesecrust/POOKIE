package com.ssafy.pookie.game.mini.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class MiniGameOverRequestDto {
    private String roomId;
    private UserDto user;
    private Integer score;
}
