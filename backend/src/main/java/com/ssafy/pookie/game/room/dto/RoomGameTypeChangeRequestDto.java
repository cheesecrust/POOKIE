package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class RoomGameTypeChangeRequestDto {
    private UserDto roomMaster;
    private String roomId;
    private RoomStateDto.GameType requestGameType;
}
