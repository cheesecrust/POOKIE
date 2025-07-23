package com.ssafy.pookie.game.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

@Getter
@AllArgsConstructor
public class LobbyUserDto {
    public enum Status {ON, GAME, OFF};

    // 초기 설정 이후 변경 불가
    private final WebSocketSession session;
    private final UserDto user;
    private Status status;

    public LobbyUserDto(WebSocketSession session, UserDto user) {
        this.session = session;
        this.user = user;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
