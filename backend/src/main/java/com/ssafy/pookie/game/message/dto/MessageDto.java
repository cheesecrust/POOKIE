package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    public enum Type { ON,
        JOIN_ROOM, LEAVE_ROOM, USER_TEAM_CHANGE, USER_READY_CHANGE, USER_FORCED_REMOVE, CHANGE_GAMETYPE,
        START_GAME, TURN_OVER, SUBMIT_ANSWER, ROUND_OVER, PAINTER_CHANGE,
        CHAT, DRAW,
        TIMER_START, GAME_OVER, OFF };

    private Type type;
    private String sid;
    private Object payload;
}
