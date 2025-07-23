package com.ssafy.pookie.game.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.RoomStateUpdate;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class GameServerService {

    private final ConcurrentHashMap<String, RoomStateDto> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LobbyUserDto> lobby = new ConcurrentHashMap<>();    // <userId, LobbyUserDto>

    /*
        유저가 게임 Lobby 로 접속 시
     */
    public void handleOn(WebSocketSession session, UserDto userDto) throws IOException {
        // 현재 사용자가 다른 방에 있다면, 기존 방에서 제서
        removeSessionFromRooms(session);

        // 기존에 접속되어 있는 사용자인지 확인 ( 중복 접속 )
        // 접속해있지 않다면 null 반환
        LobbyUserDto isExist = lobby.get(userDto.getUserId());
        if(isExist != null) {   // 기존에 동일 ID 로 접속되어 있는 사용자가 있음
            // 대기실에서 나온 사용자인지 확인
            if(isExist.getStatus() != LobbyUserDto.Status.ON) {
                isExist.setStatus(LobbyUserDto.Status.ON);
                // TODO Client response msg
                return;
            } else {
                removeFromLobby(isExist.getSession());
                log.warn("Duplicated user : {}", isExist.getUser().getUserId());
            }
        }

        // lobby 로 이동시킴
        userDto.setSid(session.getId());
        LobbyUserDto lobbyUserDto = new LobbyUserDto(session, userDto);
        lobbyUserDto.setStatus(LobbyUserDto.Status.ON);
        lobby.put(userDto.getUserId(), lobbyUserDto);
        // TODO Client response msg
        log.info("User {} entered lobby", userDto.getUserNickname());
    }

    /*
        유저가 게임 대기방으로 접속시
     */
    public void handleJoin(WebSocketSession session, JoinDto joinDto) throws IOException {
        // 1. 해당 유저가 정상적으로 로그인을 완료 한 뒤, 대기방으로 이동하는지 확인
        // 비정상적이 유저라면, 대기방 입장 불가 -> 연결 끊음
        LobbyUserDto isExist = isExistLobby(joinDto.getUser());
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
            newRoom.setGameType(joinDto.getGameType());
            newRoom.getTeamScores().computeIfAbsent("Red", k -> 0);
            newRoom.getTeamScores().computeIfAbsent("Blue", k -> 0);
            newRoom.getTempTeamScores().computeIfAbsent("Red", k -> 0);
            newRoom.getTempTeamScores().computeIfAbsent("Blue", k -> 0);
            return newRoom;
        });
        if(!room.getGameType().toString().equals(joinDto.getGameType().toString())) {
            // TODO Client response msg
            return;
        }
        // 신규 유저의 팀 배정
        joinDto.setTeam(room.assignTeamForNewUser());
        // 세션 설정
        joinDto.getUser().setSid(session.getId());
        // 게임 설정
        // 각 팀에 유저 배치
        room.getUsers().computeIfAbsent(joinDto.getTeam(), k -> new ArrayList<>())
                .add(joinDto.getUser());

        room.getSessions().add(session);
        // TODO Client response msg
        broadcastStateUpdate(room.getRoomId());
        log.info("User {} joined room {}", joinDto.getUser().getUserNickname(), room.getRoomId());
    }

    public void handleStateUpdate(WebSocketSession session, RoomStateUpdate roomStateUpdate) throws JsonProcessingException {
        RoomStateDto room = rooms.get(roomStateUpdate.getRoomId());
        if(room == null) return;

        room.setRound(roomStateUpdate.getRound());
        room.setStatus(roomStateUpdate.getStatus());

        log.info("Room Update : {}",room.toJson());
        // TODO Client response msg
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



    // GAME_PROCESS

    // 게임 시작 -> 방장이 버튼을 눌렀을 때
    public void hadleGameStart(WebSocketSession session, JoinDto roomMaster) throws IOException {
        // 현재 방의 상태를 가져옴
        RoomStateDto room = rooms.get(roomMaster.getRoomId());
        // 방이 존재하지 않음, 또는 해당 방에 있는 참가자가 아님
        if(room == null || !room.getSessions().contains(session)) return;
        // 1. 방 인원이 모드 채워졌는지
        if(room.getSessions().size() < 6) {
            session.sendMessage(new TextMessage("Required over 6 users"));
            return;
        }

        // 2. 인원 충족
        // 게임 시작 설정
        room.setStatus(RoomStateDto.Status.START);
        // 라운드 설정
        increaseRound(room);
        // 턴 설정
        turnChange(room);
        // 현재 Session ( Room ) 에 있는 User 의 Lobby Status 업데이트
        // 게임중으로 업데이트
        updateLobbyUserStatus(roomMaster, true, LobbyUserDto.Status.GAME);

        // TODO Client response msg
    }

    // 턴이 종료되었을 때
    public void handleTurnChange(WebSocketSession session, TurnDto result) {
        RoomStateDto room = rooms.get(result.getRoomId());
        if(room == null || !room.getSessions().contains(session)) return;
        // 현재 라운드 점수 기록
        writeTempTeamScore(result, room);
        // 턴 바꿔주기
        turnChange(room);
        System.out.println(room);
        // TODO Client response msg
    }

    // 게임 라운드 증가
    public void increaseRound(RoomStateDto room) {
        // 현재 대기방의 현재 라운드
        int nowRound = room.getRound();

        // 1. 게임 끝
        if(nowRound == 3) { // 더 이상 진행 불가
            // TODO Client response msg
            // 라운드 끝
        }
        // 2. 게임 진행
        else {
            room.setRound(nowRound+1);
            // TODO Client response msg
        }
    }

    // 턴 체인지
    public void turnChange(RoomStateDto room) {
        // NONE 이라면 RED 선, 아니라면 BLUE 선
        if(room.getTurn().toString().equals("NONE")) room.setTurn(RoomStateDto.Turn.RED);
        else room.setTurn(RoomStateDto.Turn.BLUE);
    }

    public void writeTempTeamScore(TurnDto result, RoomStateDto room) {
        room.getTempTeamScores().put(result.getTeam(), result.getScore());
    }

    // Lobby User Management

    // Lobby 에 있는 User 의 Status Update
    private void updateLobbyUserStatus(JoinDto user, Boolean group, LobbyUserDto.Status status) {
        // 단일 User
        if(!group) {
            lobby.get(user.getUser().getUserId()).setStatus(status);
            return;
        }

        // 단제 User -> Room
        // 동일 Session 내 모든 User 수정
        RoomStateDto room = rooms.get(user.getRoomId());
        for(String team : room.getUsers().keySet()) {
            for(UserDto roomUser : room.getUsers().get(team)) {
                lobby.get(roomUser.getUserId()).setStatus(status);
            }
        }
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
    public LobbyUserDto isExistLobby(UserDto user) {
        return lobby.get(user.getUserId());
    }
}
