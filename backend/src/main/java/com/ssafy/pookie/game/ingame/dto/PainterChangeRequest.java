package com.ssafy.pookie.game.ingame.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class PainterChangeRequest {
    private String roomId;
    private Integer curRepIdx;
    private UserDto user;
}
