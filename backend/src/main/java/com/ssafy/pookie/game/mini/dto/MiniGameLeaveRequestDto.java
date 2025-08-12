package com.ssafy.pookie.game.mini.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MiniGameLeaveRequestDto {
    private UserDto user;
}
