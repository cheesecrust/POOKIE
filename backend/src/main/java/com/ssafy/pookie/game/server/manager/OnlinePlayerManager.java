package com.ssafy.pookie.game.server.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.LobbyUserStateDto;
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
        session.sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(msg)));
    }

    // 현재 방에 있는 유저들에게 BraodCast
    // 메시지 전달 유형
    // 1. 해당 팀원들에게만
    // 2. 해당 대기방 전체
    public void broadCastMessageToRoomUser(WebSocketSession session, String RoomId, String team, Map<String, Object> msg) throws IOException {
        RoomStateDto room = this.rooms.get(RoomId);
        if(!isAuthorized(session, room)) return;

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
        권한 있음 : true
        권한 없음 : false
     */
    public Boolean isAuthorized(WebSocketSession session, RoomStateDto room) {
        return room != null && room.isIncluded(session);
    }

    /*
        해당 요청이 방장이 보낸 요청이 맞는지
        방장 O : true
        방장 X : false
     */
    public Boolean isMaster(WebSocketSession session, RoomStateDto room) {
        return room.getRoomMaster().getSession() == session;
    }

    // Lobby 에 있는 User 의 Status Update
    public void updateLobbyUserStatus(LobbyUserStateDto lobbyUserStateDto, Boolean group, LobbyUserDto.Status status) {
        // 단일 User
        if (!group) {
            lobby.get(lobbyUserStateDto.getUser().getUserAccountId()).setStatus(status);
            return;
        }

        // 단제 User -> Room
        // 동일 Session 내 모든 User 수정
        RoomStateDto room = rooms.get(lobbyUserStateDto.getRoomId());
        for (String team : room.getUsers().keySet()) {
            for (UserDto roomUser : room.getUsers().get(team)) {
                lobby.get(roomUser.getUserAccountId()).setStatus(status);
            }
        }
    }

    public boolean isMemberExistInLobby(Long userId) {
        return lobby.containsKey(userId);
    }

    /*
        현재 세션에 해당 유저가 있는지 확인
     */
    public LobbyUserDto isExistLobby(UserDto user) {
        return lobby.get(user.getUserAccountId());
    }
}
