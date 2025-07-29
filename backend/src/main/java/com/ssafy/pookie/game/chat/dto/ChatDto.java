package com.ssafy.pookie.game.chat.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;
import org.springframework.web.socket.TextMessage;
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

    public void sendChat(WebSocketSession session, RoomStateDto room) throws IOException {
        if(this.getTeam() == null || this.getTeam().toString().isEmpty() || this.getTeam() == UserDto.Team.NONE) {
            for(WebSocketSession s : room.getSessions()) {
                if(s == session) continue;
                s.sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(mappingMessage())));
            }
        } else {
            room.getUsers().get(this.team.toString()).stream().forEach((user) -> {
                if (user.getTeam() == this.team && user.getSession() != session) {
                    try {
                        user.getSession()
                                .sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(mappingMessage())));
                    } catch (IOException e) {
                        e.printStackTrace(); // 또는 log.error 등 처리
                    }
                }
            });
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
