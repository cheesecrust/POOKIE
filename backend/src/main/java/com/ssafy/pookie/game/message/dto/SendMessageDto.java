package com.ssafy.pookie.game.message.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;

@Data
@Builder
public class SendMessageDto {
    public enum sendType {BROADCAST, USER, BROADCAST_OTHER}

    private sendType msgType;
    private WebSocketSession session;
    private UserDto.Team team;
    private String roomId;
    private Map<String, Object> payload;
    @Builder.Default
    private int retryCount = 0;
    private static final int MAX_RETRY_COUNT = 3;
    
    public boolean canRetry() {
        return retryCount < MAX_RETRY_COUNT;
    }
    
    public void incrementRetry() {
        this.retryCount++;
    }
}
