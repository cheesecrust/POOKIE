package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class JoinDto {
    private String roomId;
    private UserDto user;
    private String team;
}
