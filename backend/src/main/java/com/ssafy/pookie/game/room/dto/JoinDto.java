package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class JoinDto {
    private String roomId;
    private RoomStateDto.GameType gameType;
    private UserDto user;
    private String team;
    private String roomPw = "";
}
