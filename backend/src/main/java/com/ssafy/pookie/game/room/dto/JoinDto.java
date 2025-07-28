package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class JoinDto {
    private String roomId;
    private String roomTitle;
    private RoomStateDto.GameType gameType;
    private UserDto user;
    private String roomPw = "";
}
