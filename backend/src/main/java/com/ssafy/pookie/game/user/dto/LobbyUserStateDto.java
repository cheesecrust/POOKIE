package com.ssafy.pookie.game.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LobbyUserStateDto {
    String roomId;
    UserDto user;

    public LobbyUserStateDto(UserDto user) {
        this.user = user;
    }
}
