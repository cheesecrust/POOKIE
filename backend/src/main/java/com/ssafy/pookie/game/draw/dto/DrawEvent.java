package com.ssafy.pookie.game.draw.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class DrawEvent {
    private String drawType; // "draw", "clear", "undo" 등
    private String roomId;
    private UserDto user;
    private DrawData data;
    private long timestamp;
}
