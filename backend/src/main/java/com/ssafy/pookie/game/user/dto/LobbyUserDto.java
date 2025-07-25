package com.ssafy.pookie.game.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

@Getter
@AllArgsConstructor
public class LobbyUserDto {
    public enum Status {ON, GAME, OFF};

    // 초기 설정 이후 변경 불가
    private final UserDto user;
    private Status status;

    public LobbyUserDto(WebSocketSession session, UserDto user) {
        this.user = user;
        this.user.setSession(session);
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
