package com.ssafy.pookie.game.chat.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ChatDto {
    private String roomId;
    private UserDto.Team team;
    private UserDto user;
    private String message;
    private LocalDateTime timeStamp;

    public ChatDto() {
        this.timeStamp = LocalDateTime.now();
    }

    public void sendChat(WebSocketSession session, RoomStateDto room, MessageSenderManager manager) throws IOException {
        // 전체 채팅
        if(this.getTeam() == null || this.getTeam().toString().isEmpty() || this.getTeam() == UserDto.Team.NONE) {
            for(WebSocketSession s : room.getSessions()) {      // 자기 자신을 포함하여 전송
                manager.sendMessageToUser(s, this.roomId, mappingMessage());
            }
        } else {
            manager.sendMessageBroadCast(session, this.roomId, this.team, mappingMessage());
        }
    }

    private Map<String, Object> mappingMessage() {
        return Map.of(
                "type", "CHAT",
                "team", this.team == null || this.team.toString().isEmpty() || this.team == UserDto.Team.NONE ? "ALL" : this.team.toString(),
                "from", this.user.getUserNickname(),
                "message", this.message,
                "timeStamp", this.timeStamp.toLocalTime().toString()
        );
    }
}
