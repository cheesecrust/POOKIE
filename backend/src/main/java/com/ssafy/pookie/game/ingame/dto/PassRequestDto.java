package com.ssafy.pookie.game.ingame.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class PassRequestDto {
    String roomId;
    UserDto requestUser;
}
