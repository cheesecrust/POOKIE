package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    public enum Type { ON, JOIN_ROOM, LEAVE_ROOM, START_GAME, TURN_OVER, USER_TEAM_CHANGE, USER_READY_CHANGE, USER_FORCED_REMOVE, CHAT, TIMER_START, ROUND_OVER, GAME_OVER, OFF };

    private Type type;
    private String sid;
    private Object payload;
}
