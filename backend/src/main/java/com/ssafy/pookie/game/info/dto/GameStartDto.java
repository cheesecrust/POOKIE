package com.ssafy.pookie.game.info.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameStartDto {
    private String roomId;
    private UserDto user;
}
