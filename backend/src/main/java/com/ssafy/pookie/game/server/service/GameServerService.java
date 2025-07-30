package com.ssafy.pookie.game.server.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameServerService {

    private final OnlinePlayerManager onlinePlayerManager;
    private final UserAccountsRepository userAccountsRepository;

    /*
        유저가 게임 Lobby 로 접속 시
     */
    public void handleOn(WebSocketSession session, UserDto userDto) throws IOException {
        // 현재 사용자가 다른 방에 있다면, 기존 방에서 제서
        removeSessionFromRooms(session);

        // 기존에 접속되어 있는 사용자인지 확인 ( 중복 접속 )
        // 접속해있지 않다면 null 반환
        LobbyUserDto isExist = onlinePlayerManager.getLobby().get(userDto.getUserAccountId());
        if(isExist != null) {   // 기존에 동일 ID 로 접속되어 있는 사용자가 있음
            // 대기실에서 나온 사용자인지 확인
            if(isExist.getStatus() != LobbyUserDto.Status.ON) {
                isExist.setStatus(LobbyUserDto.Status.ON);
            } else {
                // TODO 확인 해봐야함
                removeFromLobby(isExist.getUser().getSession());
                log.warn("Duplicated user : {}", isExist.getUser().getUserAccountId());
            }
        }

        // lobby 로 이동시킴
        LobbyUserDto lobbyUserDto = new LobbyUserDto(session, userDto);
        lobbyUserDto.setStatus(LobbyUserDto.Status.ON);
        onlinePlayerManager.getLobby().put(userDto.getUserAccountId(), lobbyUserDto);
        log.info("User {} entered lobby", userDto.getUserNickname());
        // ToClient
        onlinePlayerManager.sendToMessageUser(session, Map.of(
                "type", "ON",
                "msg", "연결되었습니다.",
                "user", Map.of(
                        "userId", userDto.getUserAccountId(),
                        "userEmail", userDto.getUserEmail(),
                        "userNickname", userDto.getUserNickname(),
                        "repImg", userDto.getReqImg() == null ? "" : userDto.getReqImg()
                ),
                "globalStatus", lobbyUserDto.getStatus().toString(),
                "roomList", existingRoomList()
        ));
    }

    // Room Event
    /*
        유저가 게임 대기방으로 접속시
     */
    public void handleJoin(WebSocketSession session, JoinDto joinDto) throws IOException {
        // 1. 해당 유저가 정상적으로 로그인을 완료 한 뒤, 대기방으로 이동하는지 확인
        // 비정상적이 유저라면, 대기방 입장 불가 -> 연결 끊음
        LobbyUserDto isExist = isExistLobby(joinDto.getUser());
        if(isExist == null || isExist.getStatus() == null ||!isExist.getStatus().equals(LobbyUserDto.Status.ON)) {
            removeFromLobby(session);
            log.error("POLICY_VIOLATION : {}", joinDto.getUser().getUserEmail() == null ? session.getId() : joinDto.getUser().getUserEmail());
            return;
        }
        // 현재 사용자가 다른 방에도 있다면, 기존 방에서 제거
        removeSessionFromRooms(session);

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
            // TODO Builder 로 변경
            RoomStateDto newRoom = new RoomStateDto();
            newRoom.setRoomId(id);
            newRoom.setRoomTitle(joinDto.getRoomTitle());
            newRoom.setGameType(joinDto.getGameType());
            newRoom.getTeamScores().computeIfAbsent("RED", k -> 0);
            newRoom.getTeamScores().computeIfAbsent("BLUE", k -> 0);
            newRoom.getTempTeamScores().computeIfAbsent("RED", k -> 0);
            newRoom.getTempTeamScores().computeIfAbsent("BLUE", k -> 0);
            newRoom.getUsers().put("RED", new ArrayList<>());
            newRoom.getUsers().put("BLUE", new ArrayList<>());
            joinDto.getUser().setGrant(UserDto.Grant.MASTER);
            joinDto.getUser().setStatus(UserDto.Status.READY);
            newRoom.setRoomMaster(joinDto.getUser());
            newRoom.setGameInfo(new GameInfoDto());
            // 방 비밀번호가 있음
            if (joinDto.getRoomPw() != null) newRoom.setRoomPw(joinDto.getRoomPw());

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
                            "type", "LEAVE",
                            "msg", "Lobby 로 돌아갑니다."
                    ));
                    onlinePlayerManager.getLobby().get(teamUser.getUserAccountId()).setStatus(LobbyUserDto.Status.ON);
                    find = true;
                    room.getSessions().remove(session);
                    room.getUsers().get(team).remove(teamUser);
                    onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(room.getRoomId(), teamUser), false, LobbyUserDto.Status.ON);
                    // 방에 아무도 남지 않은 경우 -> 방 삭제
                    if(room.getSessions().isEmpty()) {
                        removeRoomFromServer(roomId);
                        log.info("Room {} was disappeared", room.getRoomId());
                        broadcastRoomListToLobbyUsers();
                        return;
                    }
                    broadcastRoomListToLobbyUsers();
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

    /*
        유저를 대기방에서 제거
        여러 방에 있을 수 있는가? => 아니라면 roomId 반환
     */
    public String removeSessionFromRooms(WebSocketSession session) {
        for (RoomStateDto room : onlinePlayerManager.getRooms().values()) {
            try {
                if (room.getSessions().contains(session)) {
                    handleLeave(session, room.getRoomId());
                    return room.getRoomId();
                }
            } catch (Exception e) {
                log.error(e.getMessage());
            }
        }
        return null;
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
    // 방 삭제
    public void removeRoomFromServer(String getRoomId) {
        RoomStateDto room = onlinePlayerManager.getRooms().get(getRoomId);
        onlinePlayerManager.getLobby().values().stream().forEach((user) -> {
            if(user.getStatus() == LobbyUserDto.Status.ON) {
                try {
                    onlinePlayerManager.sendToMessageUser(user.getUser().getSession(), Map.of(
                            "type", "REMOVED_ROOM",
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
                    onlinePlayerManager.getRooms().remove(getRoomId);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
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

    // GAME_PROCESS

    // Lobby User Management

    /*
        유저를 세션에서 제거
        session id를 가지고 userDto를 가져와서 이를 이용해서 offline과 user email로 제거
     */
    public void removeFromLobby(WebSocketSession session) throws IOException {
        String roomId = removeSessionFromRooms(session);
        if (roomId != null) onlinePlayerManager.getRooms().remove(roomId);
        Long userAccountId = (Long) session.getAttributes().get("userAccountId");
        onlinePlayerManager.getLobby().remove(userAccountId);

        // offline 처리
        UserAccounts userAccount = userAccountsRepository.findById(userAccountId)
                .orElseThrow(() -> new IOException("getLobbyUser: user account not found"));
        log.info(onlinePlayerManager.getLobby().size() + " Lobby Users found");
        userAccount.updateOnline(false);
        userAccountsRepository.save(userAccount);
        
        session.close(CloseStatus.POLICY_VIOLATION);
    }

    public void joinInLobby(WebSocketSession session) throws IOException {
        UserDto user = UserDto.builder()
                .session(session)
                .userAccountId((Long) session.getAttributes().get("userAccountId"))
                .userEmail((String) session.getAttributes().get("userEmail"))
                .userNickname((String) session.getAttributes().get("nickname"))
                .status(UserDto.Status.NONE)
                .grant(UserDto.Grant.NONE)
                .build();
        handleOn(session, user);

        Long userId = (Long) session.getAttributes().get("userAccountId");
        UserAccounts userAccount = userAccountsRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user account not found"));

        userAccount.updateOnline(true);
        userAccountsRepository.save(userAccount);
    }

    /*
        현재 세션에 해당 유저가 있는지 확인
     */
    public LobbyUserDto isExistLobby(UserDto user) {
        return onlinePlayerManager.getLobby().get(user.getUserAccountId());
    }
    /*
        현재 생성되어 있는 방 리스트 전달
     */
    public List<?> existingRoomList() {
        return onlinePlayerManager.getRooms().values().stream().map((room) -> Map.of(
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

        )).collect(Collectors.toList());
    }

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
        List<?> roomList = existingRoomList();
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
