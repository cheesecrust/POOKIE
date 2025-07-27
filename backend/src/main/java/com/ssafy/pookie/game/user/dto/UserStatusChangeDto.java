package com.ssafy.pookie.game.user.dto;

import lombok.Data;

@Data
public class UserStatusChangeDto {
    // User 가 Room 에서의 Ready 상태 변경을 위한 DTO
    private String roomId;
    private UserDto user;
    private String team;
    private boolean ready;        // READY / NONE
}
