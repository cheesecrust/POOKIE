package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    public enum Type { ON, LOG,
        // lobby event ( HOME )
        // request
        ROOM_JOIN,
        // response
        ROOM_LIST, ROOM_CREATED, ROOM_REMOVED, ROOM_UPDATE,

        // Room event ( WAITING ROOM )
        // request
        WAITING_TEAM_CHANGE, WAITING_READY_CHANGE, WAITING_GAMETYPE_CHANGE,
        WAITING_GAME_START, WAITING_USER_REMOVE, WAITING_USER_LEAVE,
        WAITING_ROOM_UPDATE,
        // response
        WAITING_JOINED, WAITING_TEAM_CHANGED, WAITING_READY_CHANGED, WAITING_GAMETYPE_CHANGED,
        WAITING_USER_REMOVED, WAITING_USER_LEAVED, WAITING_GAME_OVER,
        WAITING_ROOM_UPDATED,

        // INGAME
        // request
        GAME_TURN_OVER, GAME_ROUND_OVER, GAME_ANSWER_SUBMIT, GAME_PAINTER_CHANGE,
        GAME_DRAW, GAME_PASS, GAME_DRAW_EVENT,
        // response
        GAME_STARTED, GAME_KEYWORD, GAME_TURN_OVERED, GAME_ROUND_OVERED,
        GAME_NEW_ROUND, GAME_ANSWER_SUBMITTED, GAME_PAINTER_CHANGED, GAME_PASSED,

        // TIMER
        // request
        TIMER_START,
        // CHAT
        // request
        CHAT,
        // MINI GAME
        MINIGAME_JOIN, MINIGAME_SCORE_UPDATE, MINIGAME_OVER, MINIGAME_LEAVE, MINIGAME_REGAME,

        MINIGAME_JOINED, MINIGAME_SCORE_UPDATED, MINIGAME_OVERED, MINIGAME_LEAVED, MINIGAME_RESET,
        // ERROR
        ERROR
    };

    private Type type;
    private String sid;
    private Object payload;
}
