package com.ssafy.pookie.game.room.dto;

import lombok.Data;

@Data
public class RoomStateUpdateDto {
    /*
        단순히 게임 상태만 갱신
        -> 유저의 이탈 등은 Service 혹은 Controller 단에서 갱신
     */
    private String roomId;
    private int round;
    private RoomStateDto.Status status;
}
