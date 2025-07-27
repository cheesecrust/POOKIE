package com.ssafy.pookie.game.user.dto;

import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

@Data
public class UserTeamChangeRequestDto {
    public enum Team {RED, BLUE};

    private String roomId;
    private UserDto user;
    private Team fromTeam;
    private Team toTeam;
}
