package com.ssafy.pookie.game.message.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;

@Data
@Builder
public class SendMessageDto {
    public enum sendType {BROADCAST, USER}

    private sendType msgType;
    private WebSocketSession session;
    private UserDto.Team team;
    private String roomId;
    private Map<String, Object> payload;
}
