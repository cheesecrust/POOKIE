package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class FollowRequestDto {
    private Long userId;
    private UserDto user;
}
