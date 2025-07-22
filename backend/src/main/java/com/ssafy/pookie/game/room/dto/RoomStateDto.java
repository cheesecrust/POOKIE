package com.ssafy.pookie.game.room.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Data
public class RoomStateDto {
    private int round = 1;
    private String status = "WAITING";
    private String currentTeam = "RED";
    private Map<String, String> users = new HashMap<>();
    private Set<WebSocketSession> sessions = new HashSet<>();

    public String toJson() throws JsonProcessingException {
        return new ObjectMapper().writeValueAsString(
                Map.of(
                        "round", round,
                        "status", status,
                        "currentTeam", currentTeam
                ));
    }
}
