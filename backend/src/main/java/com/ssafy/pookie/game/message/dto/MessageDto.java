package com.ssafy.pookie.game.message.dto;

import lombok.Data;

@Data
public class MessageDto {
    public enum Type { JOIN, STATE_UPDATE, CHAT, ROUND_END, GAME_OVER };

    private Type type;
    private String sid;
    private Object payload;
}
