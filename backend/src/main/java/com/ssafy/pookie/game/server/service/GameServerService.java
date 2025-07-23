package com.ssafy.pookie.game.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.RoomStateUpdate;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class GameServerService {

    private final ConcurrentHashMap<String, RoomStateDto> rooms = new ConcurrentHashMap<>();
    private final Set<LobbyUserDto> lobby = ConcurrentHashMap.newKeySet();

    /*
        유저가 게임 Lobby 로 접속 시
     */
    public void handleOn(WebSocketSession session, UserDto userDto) throws IOException {
        // 현재 사용자가 다른 방에 있다면, 기존 방에서 제서
        removeSessionFromRooms(session);

        // 기존에 접속되어 있는 사용자인지 확인 ( 중복 접속 )
        // 접속해있지 않다면 null 반환
        LobbyUserDto isExist = lobby.stream().filter((user) -> {
            return user.getUser().getUserId().equals(userDto.getUserId());
        }).findFirst().orElse(null);
        if(isExist != null) {   // 기존에 동일 ID 로 접속되어 있는 사용자가 있음
            // 대기실에서 나온 사용자인지 확인
            if(isExist.getStatus() != LobbyUserDto.Status.ON) {
                isExist.setStatus(LobbyUserDto.Status.ON);
                return;
            } else {
                removeFromLobby(isExist.getSession());
                log.warn("Duplicated user : {}", isExist.getUser().getUserId());
            }
        }

        // lobby 로 이동시킴
        LobbyUserDto lobbyUserDto = new LobbyUserDto(session, userDto);
        lobbyUserDto.setStatus(LobbyUserDto.Status.ON);
        lobby.add(lobbyUserDto);

        log.info("User {} entered lobby", userDto.getUserNickname());
    }

    /*
        유저가 게임 대기방으로 접속시
     */
    public void handleJoin(WebSocketSession session, JoinDto joinDto) throws IOException {
        // 1. 해당 유저가 정상적으로 로그인을 완료 한 뒤, 대기방으로 이동하는지 확인
        // 비정상적이 유저라면, 대기방 입장 불가 -> 연결 끊음
        LobbyUserDto isExist = isExistLobby(session);
        if(isExist == null || isExist.getStatus() == null ||!isExist.getStatus().equals(LobbyUserDto.Status.ON)) {
            removeFromLobby(session);
            log.error("POLICY_VIOLATION : {}", joinDto.getUser().getUserId() == null ? session.getId() : joinDto.getUser().getUserId());
            return;
        }
        // 현재 사용자가 다른 방에도 있다면, 기존 방에서 제거
        removeSessionFromRooms(session);
        // 기존에 있던 방이라면 입장, 없던 방이라면 생성
        RoomStateDto room = rooms.computeIfAbsent(joinDto.getRoomId(), id -> {
            RoomStateDto newRoom = new RoomStateDto();
            newRoom.setRoomId(id);
            return newRoom;
        });

        // 신규 유저의 팀 배정
        joinDto.setTeam(room.assignTeamForNewUser());
        // 각 팀에 유저 배치
        room.getUsers().computeIfAbsent(joinDto.getTeam(), k -> new ArrayList<>())
                .add(joinDto.getUser());

        room.getSessions().add(session);

        broadcastStateUpdate(room.getRoomId());

        log.info("User {} joined room {}", joinDto.getUser().getUserNickname(), room.getRoomId());
    }

    public void handleStateUpdate(WebSocketSession session, RoomStateUpdate roomStateUpdate) throws JsonProcessingException {
        RoomStateDto room = rooms.get(roomStateUpdate.getRoomId());
        if(room == null) return;

        room.setRound(roomStateUpdate.getRound());
        room.setStatus(roomStateUpdate.getStatus());

        log.info("Room Update : {}",room.toJson());
        broadcastStateUpdate(roomStateUpdate.getRoomId());
    }

    private void sendStateUpdate(WebSocketSession session, String roomId) {
        RoomStateDto room = rooms.get(roomId);
        if(room == null) return;

        try {
            // 특정 방 인원들에게 broadcast 로 메시지 전달
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

    public void handleLeave(WebSocketSession session, String roomId) {
        RoomStateDto room = rooms.get(roomId);
        if(room == null) return;

        // 해당 룸에서 세션과 유저 제거
        room.getSessions().remove(session);
        room.getUsers().values().forEach(userList -> {
            userList.removeIf(user -> user.getSid().equals(session.getId()));
        });

        broadcastStateUpdate(roomId);

        log.info("Session {} left room {}", session.getId(), roomId);
    }

    /*
        유저를 대기방에서 제거
     */
    public void removeSessionFromRooms(WebSocketSession session) {
        rooms.values().forEach(room -> {
            if(room.getSessions().contains(session)) {
                handleLeave(session, room.getRoomId());
            }
        });
    }

    /*
        유저를 세션에서 제거
     */
    public void removeFromLobby(WebSocketSession session) throws IOException {
        removeSessionFromRooms(session);
        rooms.remove(session);
        session.close(CloseStatus.POLICY_VIOLATION);
    }

    /*
        현재 세션에 해당 유저가 있는지 확인
     */
    public LobbyUserDto isExistLobby(WebSocketSession session) {
        return lobby.stream().filter((user) -> user.getSession().equals(session))
                .findFirst().orElse(null);
    }
}
