package com.ssafy.pookie.game.server.service;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.RoomStateUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class GameServerService {
    private final ConcurrentHashMap<String, RoomStateDto> rooms = new ConcurrentHashMap<>();

    public void handleJoin(WebSocketSession session, JoinDto joinDto) {
        RoomStateDto room = rooms.computeIfAbsent(joinDto.getRoomId(), (id) -> {
            return new RoomStateDto();
        });

        room.getUsers().put(
                session.getId(),
                joinDto.getUser().getUserNickname());


    }

    public void handleStateUpdate(WebSocketSession session, RoomStateUpdate roomStateUpdate) {
        RoomStateDto room = rooms.get(roomStateUpdate.getRoomId());
        if(room == null) return;

        room.setRound(roomStateUpdate.getRound());
        room.setStatus(roomStateUpdate.getStatus());
        room.setCurrentTeam(roomStateUpdate.getCurrentTeam());

        broadcastStateUpdate(roomStateUpdate.getRoomId());
    }

    private void sendStateUpdate(WebSocketSession session, String roomId) {
        RoomStateDto room = rooms.get(roomId);
        if(room == null) return;

        try {
            session.sendMessage(new TextMessage(room.toJson()));
        } catch(Exception e) {
            e.printStackTrace();
            log.error(e.getMessage());
        }
    }

    private void broadcastStateUpdate(String roomId) {
        RoomStateDto room = rooms.get(roomId);
        if(room == null) return;

        for(WebSocketSession session : room.getSessions()) {
            sendStateUpdate(session, roomId);
        }
    }
}
