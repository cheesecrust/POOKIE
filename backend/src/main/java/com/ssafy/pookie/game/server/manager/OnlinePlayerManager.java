package com.ssafy.pookie.game.server.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Getter
@Slf4j
public class OnlinePlayerManager {
    private final ConcurrentHashMap<String, RoomStateDto> rooms = new ConcurrentHashMap<>();    // <roomId, RoomStateDto>
    private final ConcurrentHashMap<Long, LobbyUserDto> lobby = new ConcurrentHashMap<>();    // <userAccountId, LobbyUserDto>

    /*
        특정 유저에게만 Message 전달
     */
    public void sendToMessageUser(WebSocketSession session, Map<String, Object> msg) throws IOException {
        log.info("sendMessage {} : {}", session, msg);
        session.sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(msg)));
    }

    // 현재 방에 있는 유저들에게 BraodCast
    // 메시지 전달 유형
    // 1. 해당 팀원들에게만
    // 2. 해당 대기방 전체
    public void broadCastMessageToRoomUser(WebSocketSession session, String RoomId, String team, Map<String, Object> msg) throws IOException {
        RoomStateDto room = this.rooms.get(RoomId);
        if(isAuthorized(session, room)) return;

        // 1. 팀원들에게만 전달
        if(team != null) {
            for(UserDto user : room.getUsers().get(team)) {
                user.getSession().sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(msg)));
            }
        } else {    // 2. BroadCast 전달
            for(WebSocketSession user : room.getSessions()) {
                user.sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(msg)));
            }
        }
    }

    /*
        해당 방이 존재하고, 해당 유저의 권한이 있는지
     */
    public Boolean isAuthorized(WebSocketSession session, RoomStateDto room) {
        return room == null || !room.isIncluded(session);
    }
}
