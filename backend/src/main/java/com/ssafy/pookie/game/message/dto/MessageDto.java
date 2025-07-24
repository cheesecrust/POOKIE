package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    /*
        ON : 게임 접속
        JOIN : 대기방 입장
        LEAVE : 대기방 퇴장
        GAME_START : 게임 시작
        CHAT : 해당 룸의 채팅
        GAME_OVER : 게임 종료
        OFF : 게임 접속 해제
     */
    public enum Type { ON, JOIN, LEAVE, GAME_START, TURN_CHANGE, TEAM_CHANGE, USER_READY_CHANGE, FORCED_REMOVE, CHAT, ROUND_OVER, GAME_OVER, OFF };

    private Type type;
    private String sid;
    private Object payload;
}
