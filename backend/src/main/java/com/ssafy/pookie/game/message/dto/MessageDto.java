package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    /*
        ON : 게임 접속
        JOIN : 대기방 입장
        LEAVE : 대기방 퇴장
        STATE_UPDATE : 게임 진행 중 ROOM 상태 업데이트
        CHAT : 해당 룸의 채팅
        GAME_OVER : 게임 종료
        OFF : 게임 접속 해제
     */
    public enum Type { ON, JOIN, LEAVE, STATE_UPDATE, CHAT, ROUND_END, GAME_OVER, OFF };

    private Type type;
    private String sid;
    private Object payload;
}
