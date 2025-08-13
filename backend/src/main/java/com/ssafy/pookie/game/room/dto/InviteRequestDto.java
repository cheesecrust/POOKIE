package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class InviteRequestDto {
    private UserDto user;
    private Long invitedUserId;
    private String roomId;
}
