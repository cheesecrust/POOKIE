package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomGameTypeChangeRequestDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.user.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameRoomService {
    private final OnlinePlayerManager onlinePlayerManager;
    private final GameServerService gameServerService;
    /*
        유저가 게임 대기방으로 접속시
     */
    public void handleJoin(WebSocketSession session, JoinDto joinDto) throws IOException {
        log.info("JOIN REQUEST : ROOM {} FROM {}", joinDto.getRoomTitle(), joinDto.getUser().getUserEmail());
        // 1. 해당 유저가 정상적으로 로그인을 완료 한 뒤, 대기방으로 이동하는지 확인
        // 비정상적이 유저라면, 대기방 입장 불가 -> 연결 끊음
        LobbyUserDto isExist = onlinePlayerManager.isExistLobby(joinDto.getUser());
        if(isExist == null || isExist.getStatus() == null ||!isExist.getStatus().equals(LobbyUserDto.Status.ON)) {
            onlinePlayerManager.removeFromLobby(session);
            log.error("POLICY_VIOLATION : {}", joinDto.getUser().getUserEmail() == null ? session.getId() : joinDto.getUser().getUserEmail());
            return;
        }
        // 현재 사용자가 다른 방에도 있다면, 기존 방에서 제거
        onlinePlayerManager.removeSessionFromRooms(session);

        boolean create = false;
        if(joinDto.getRoomId() == null || joinDto.getRoomId().isEmpty()) {
            String tempUUID = UUID.randomUUID().toString();
            while(onlinePlayerManager.getRooms().contains(tempUUID)) tempUUID = UUID.randomUUID().toString();

            joinDto.setRoomId(tempUUID);
            create = true;
        } else if(!onlinePlayerManager.getRooms().containsKey(joinDto.getRoomId())){
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "존재하지 않는 방입니다."
            ));
            return;
        }
        // 기존에 있던 방이라면 입장, 없던 방이라면 생성
        RoomStateDto room = onlinePlayerManager.getRooms().computeIfAbsent(joinDto.getRoomId(), id -> {
            RoomStateDto newRoom = RoomStateDto.builder()
                    .roomId(id)
                    .roomTitle(joinDto.getRoomTitle())
                    .gameType(joinDto.getGameType())
                    .roomPw(joinDto.getRoomPw() == null ? "" : joinDto.getRoomPw())
                    .users(new HashMap<>(Map.of("RED", new ArrayList<>(), "BLUE", new ArrayList<>())))
                    .teamScores(new HashMap<>(Map.of("RED", 0, "BLUE", 0)))
                    .tempTeamScores(new HashMap<>(Map.of("RED", 0, "BLUE", 0)))
                    .roomMaster(joinDto.getUser())
                    .gameInfo(new GameInfoDto())
                    .sessions(new HashSet<>())
                    .build();

            log.info("Room {} was created", newRoom.getRoomId());

            return newRoom;
        });
        if(create) broadCastCreateRoomEvent(room);
        if(!room.getGameType().toString().equals(joinDto.getGameType().toString())) {
            log.warn("Room GameType does not match");
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "GameType이 일치하지 않습니다."
            ));
            return;
        }

        // 비밀번호 확인
        if((room.getRoomPw() != null || !room.getRoomPw().isEmpty()) &&
                !room.getRoomPw().equals(joinDto.getRoomPw())) {
            log.warn("Room Password Mismatch");
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "비밀번호가 틀렸습니다."
            ));
            return;
        }

        // 신규 유저의 팀 배정
        // 일반 플레이어 -> Default 는 Ready 상태
        joinDto.getUser().setTeam(room.assignTeamForNewUser());
        if(joinDto.getUser().getGrant() == UserDto.Grant.NONE) {
            joinDto.getUser().setStatus(UserDto.Status.READY);
            joinDto.getUser().setGrant(UserDto.Grant.PLAYER);
        }
        // 세션 설정
        // 게임 설정
        // 각 팀에 유저 배치
        room.getUsers().computeIfAbsent(joinDto.getUser().getTeam().toString(), k -> new ArrayList<>())
                .add(joinDto.getUser());

        room.getSessions().add(session);
        onlinePlayerManager.getLobby().get(joinDto.getUser().getUserAccountId()).setStatus(LobbyUserDto.Status.WAITING);
        log.info("User {} joined room {}", joinDto.getUser().getUserNickname(), room.getRoomTitle());

        // Client response msg
        onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null,
                Map.of(
                        "type", "ROOM_JOINED",
                        "msg", joinDto.getUser().getUserNickname() + "가 입장하였습니다.",
                        "room", room.mappingRoomInfo()
                ));
    }

    // User 가 Room 을 떠날 때
    public void handleLeave(WebSocketSession session, String roomId) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(roomId);
        if(!onlinePlayerManager.isAuthorized(session, room)) return;
        String leaveUserNickName = "";
        // 해당 룸에서 세션과 유저 제거
        boolean find = false;
        for(String team : room.getUsers().keySet()) {
            List<UserDto> teamUsers = room.getUsers().get(team);
            for(UserDto teamUser : teamUsers) {
                if(teamUser.getSession() == session) {
                    onlinePlayerManager.sendToMessageUser(session, Map.of(
                            "type", "LEAVED_ROOM",
                            "msg", "Lobby 로 돌아갑니다."
                    ));
                    find = true;
                    teamUser.setGrant(UserDto.Grant.NONE);
                    teamUser.moveToLobby();
                    room.getSessions().remove(session);
                    room.getUsers().get(team).remove(teamUser);
                    // 방에 아무도 남지 않은 경우 -> 방 삭제
                    if(room.getSessions().isEmpty()) {
                        onlinePlayerManager.removeRoomFromServer(roomId);
                        onlinePlayerManager.sendToMessageUser(session, Map.of(
                                "type", "UPDATE_ROOM_LIST",
                                "roomList", gameServerService.existingRoomList()
                        ));
                        onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(room.getRoomId(), teamUser), false, LobbyUserDto.Status.ON);
                        return;
                    }
                    onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(room.getRoomId(), teamUser), false, LobbyUserDto.Status.ON);
                    leaveUserNickName = teamUser.getUserNickname();
                    if(teamUser.getGrant() == UserDto.Grant.MASTER) {
                        regrantRoomMaster(room);
                    }
                    break;
                }
            }
            if(find) break;
        }

        if(!find) return;

        for(WebSocketSession teamSession : room.getSessions()) {
            onlinePlayerManager.sendToMessageUser(teamSession, Map.of(
                    "type", "PLAYER_LEFT",
                    "msg", leaveUserNickName + "가 나갔습니다.",
                    "room", room.mappingRoomInfo()
            ));
        }
    }

    // 방장 재배정
    public void regrantRoomMaster(RoomStateDto room) {
        Map<String, List<UserDto>> user = room.getUsers();
        String[] team = {"RED", "BLUE"};
        int teamIdx = new Random().nextInt(2);
        int playerIdx = new Random().nextInt(user.get(team[teamIdx]).isEmpty() ? 1 : user.get(team[teamIdx]).size());

        if(user.get(team[teamIdx]).size() <= playerIdx) {
            teamIdx = (teamIdx+1)%2;
        }
        user.get(team[teamIdx]).get(playerIdx).setGrant(UserDto.Grant.MASTER);
        room.setRoomMaster(user.get(team[teamIdx]).get(playerIdx));
    }

    // User 팀 바꾸기
    public void handleUserTeamChange(WebSocketSession session, UserTeamChangeRequestDto teamChangeRequest) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(teamChangeRequest.getRoomId());
        if(!onlinePlayerManager.isAuthorized(session, room)) return;

        if(!teamChangeRequest.changeTeam(room)) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "처리 중 오류가 발생하였습니다."
            ));
            return;
        }

        onlinePlayerManager.broadCastMessageToRoomUser(session, teamChangeRequest.getRoomId(), null, Map.of(
                "type", "USER_TEAM_CHANGED",
                "msg", teamChangeRequest.getUser().getUserNickname()+"이 팀을 변경하였습니다.",
                "room", room.mappingRoomInfo()
        ));
    }

    // 유저 READY 상태 변경
    public void handleUserStatus(WebSocketSession session, UserStatusChangeDto request) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
        if(!onlinePlayerManager.isAuthorized(session, room) || room.getRoomMaster().getSession() == session) return;

        if(!request.changeStatus(room)) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "처리 중 오류가 발생하였습니다."
            ));
            return;
        }
        onlinePlayerManager.broadCastMessageToRoomUser(session, request.getRoomId(), null, Map.of(
                "type", "USER_READY_CHANGED",
                "room", room.mappingRoomInfo()
        ));
    }
    // 유저 강퇴 ( 방장만 )
    public void handleForcedRemoval(WebSocketSession session, RoomMasterForcedRemovalDto request) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
        if(!onlinePlayerManager.isAuthorized(session, room)) return;

        // 방장인지 확인
        if(room.getRoomMaster().getSession() != session) return;

        UserDto removeTarget = request.findRemoveTarget(room);
        if(removeTarget == null || removeTarget.getSession() == session) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "대상을 확인해주세요."
            ));
            return;
        }

        handleLeave(removeTarget.getSession(), request.getRoomId());
    }

    // GAME TYPE CHANGE
    public void handleGameTypeChange(RoomGameTypeChangeRequestDto gameTypeChangeRequest) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(gameTypeChangeRequest.getRoomId());
        if(!onlinePlayerManager.isAuthorized(gameTypeChangeRequest.getRoomMaster().getSession(), room) ||
        !onlinePlayerManager.isMaster(gameTypeChangeRequest.getRoomMaster().getSession(), room)) {
            onlinePlayerManager.sendToMessageUser(gameTypeChangeRequest.getRoomMaster().getSession(), Map.of(
                    "type", "ERROR",
                    "msg", "잘못된 요청입니다."
            ));
            return;
        }
        room.setGameType(gameTypeChangeRequest.getRequestGameType());
        log.info("Room {} was changed {}", room.getRoomId(), room.getGameType().toString());
        onlinePlayerManager.broadCastMessageToRoomUser(gameTypeChangeRequest.getRoomMaster().getSession(), gameTypeChangeRequest.getRoomId(), null, Map.of(
                "type", "CHANGED_GAMETYPE",
                "msg", "게임이 변경되었습니다.",
                "room", room.mappingRoomInfo()
        ));
    }

    // Sending Message
    // 방이 생성되었을 때, GAME 중이 아닌, Lobby 에 있는 상태의 player 들에게 정보 업데이트
    public void broadCastCreateRoomEvent(RoomStateDto room) {
        onlinePlayerManager.getLobby().values().stream().forEach((user) -> {
            if(user.getStatus() == LobbyUserDto.Status.ON) {
                try {
                    onlinePlayerManager.sendToMessageUser(user.getUser().getSession(), Map.of(
                            "type", "CREATED_ROOM",
                            "room", Map.of(
                                    "roomId", room.getRoomId(),
                                    "roomTitle", room.getRoomTitle(),
                                    "gameType", room.getGameType(),
                                    "roomMaster", room.getRoomMaster().getUserNickname(),
                                    "roomPw", room.getRoomPw() != null && !room.getRoomPw().isEmpty(),
                                    "teamInfo", Map.of(
                                            "RED", room.getUsers().getOrDefault("RED", List.of()).size(),
                                            "BLUE", room.getUsers().getOrDefault("BLUE", List.of()).size(),
                                            "TOTAL", room.getUsers().getOrDefault("RED", List.of()).size()+room.getUsers().getOrDefault("BLUE", List.of()).size()
                                    )
                            )));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private void broadcastRoomListToLobbyUsers() throws IOException{
        List<?> roomList = gameServerService.existingRoomList();
        onlinePlayerManager.getLobby().values().stream().forEach((user) -> {
            try {
                if(user.getStatus() == LobbyUserDto.Status.ON) {
                    onlinePlayerManager.sendToMessageUser(user.getUser().getSession(), Map.of(
                            "type", "UPDATE_ROOM_LIST",
                            "roomList", roomList
                    ));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
}
