package com.ssafy.pookie.game.room.dto;

import lombok.Data;

@Data
public class RoomStateUpdate {
    private String roomId;
    private int round;
    private String status;
    private String currentTeam;
}
