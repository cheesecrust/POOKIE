package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.character.repository.CharacterCatalogRepository;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomGameTypeChangeRequestDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.server.service.GameServerService;
import com.ssafy.pookie.game.user.dto.*;
import com.ssafy.pookie.metrics.SocketMetrics;
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
    private final SocketMetrics socketMetrics;
    private final MessageSenderManager messageSenderManager;
    private final CharacterService characterService;
    /*
        유저가 게임 대기방으로 접속시
     */
    public void handleJoin(WebSocketSession session, JoinDto joinDto) throws IOException {
        log.info("JOIN REQUEST : ROOM {} FROM {}", joinDto.getRoomTitle()==null ? joinDto.getRoomId() : joinDto.getRoomTitle(), joinDto.getUser().getUserEmail());
        try {
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
                if(joinDto.getRoomTitle().length() > 12) throw new IllegalArgumentException("방 제목은 12글자 이하로 작성해주세요.");

                String tempUUID = UUID.randomUUID().toString();
                while(onlinePlayerManager.getRooms().contains(tempUUID)) tempUUID = UUID.randomUUID().toString();

                joinDto.setRoomId(tempUUID);
                create = true;
            } else if(!onlinePlayerManager.getRooms().containsKey(joinDto.getRoomId())) throw new IllegalArgumentException("존재하지 않는 방입니다.");

            // 기존에 있던 방이라면 입장, 없던 방이라면 생성
            socketMetrics.recordRoomJoin(joinDto.getGameType().toString(), joinDto.getUser().getTeam().toString());
            RoomStateDto room = createNewRoom(joinDto);

            if(create) {
                broadCastCreateRoomEvent(room);
                joinDto.getUser().setGrant(UserDto.Grant.MASTER);
            }
            if(!room.getGameType().toString().equals(joinDto.getGameType().toString())) throw new IllegalArgumentException("GameType이 일치하지 않습니다.");

            // 비밀번호 확인
            if((room.getRoomPw() != null || !room.getRoomPw().isEmpty()) &&
                    !room.getRoomPw().equals(joinDto.getRoomPw())) throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");

            // 신규 유저의 팀 배정
            // 팀원 수 확인
            if(room.getSessions().size() >= 6) throw new IllegalArgumentException("인원이 가득 차 있습니다.");

            // 일반 플레이어 -> Default 는 Ready 상태
            joinDto.getUser().setTeam(room.assignTeamForNewUser());
            if(joinDto.getUser().getGrant() == UserDto.Grant.NONE) {
                joinDto.getUser().setGrant(UserDto.Grant.PLAYER);
            }
            joinDto.getUser().setStatus(UserDto.Status.READY);
            joinDto.getUser().setReqImg(characterService.getRepPookie(joinDto.getUser().getUserAccountId())
                    .getCharacterName());
            // 세션 설정
            // 게임 설정
            // 각 팀에 유저 배치
            room.getUsers().computeIfAbsent(joinDto.getUser().getTeam().toString(), k -> new ArrayList<>())
                    .add(joinDto.getUser());

            room.getSessions().add(session);
            onlinePlayerManager.getLobby().get(joinDto.getUser().getUserAccountId()).setStatus(LobbyUserDto.Status.WAITING);
            log.info("User {} joined room {} ({})", joinDto.getUser().getUserNickname(), room.getRoomTitle(), joinDto.getUser().getGrant());

            // Client response msg
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null,
                    Map.of(
                            "type", MessageDto.Type.WAITING_JOINED.toString(),
                            "msg", joinDto.getUser().getUserNickname() + "님이 입장하였습니다.",
                            "room", room.mappingRoomInfo()
                    ));
            onlinePlayerManager.sendUpdateRoomStateToUserOn(room);
        } catch(IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }
    }

    private RoomStateDto createNewRoom(JoinDto joinDto) {
        return onlinePlayerManager.getRooms().computeIfAbsent(joinDto.getRoomId(), id -> {
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
                    .status(RoomStateDto.Status.WAITING)
                    .build();

            log.info("Room {} was created", newRoom.getRoomId());
            socketMetrics.recordRoomCreated(newRoom.getGameType().toString());

            return newRoom;
        });
    }

    // User 가 Room 을 떠날 때
    public void handleLeave(WebSocketSession session, String roomId, Boolean forced) throws IOException {
        try {
            // 1. 현재 방을 가져온다.
            RoomStateDto room = onlinePlayerManager.getRooms().get(roomId);
            log.info("LEAVE REQUEST : ROOM {} FROM {}", room.getRoomTitle(), session.getAttributes().get("userEmail"));
            // 1-1. 현재 방이 존재하고, 해당 방에 요청한 사람이 있는지 확인
            if (!onlinePlayerManager.isAuthorized(session, room)) throw new IllegalArgumentException("잘못된 요청입니다.");

            // 정상적인 유저가 맞을 때
            // 2. 현재 나가려는 유저의 정보를 가져옴
            UserDto leaveUser = null;
            for (String team : room.getUsers().keySet()) {
                for(UserDto user : room.getUsers().get(team)) {
                    if(user.getSession() == session) {
                        leaveUser = user;
                        break;
                    }
                    if(leaveUser != null) break;
                }
            }
            // 2-1. 유저를 방에서 제거한다.
            if(leaveUser != null) {
                socketMetrics.recordRoomLeave(room.getGameType().toString(), leaveUser.getTeam().toString());
            }
            room.removeUser(session);
            log.info("Player {} was LEAVED ROOM", session.getAttributes().get("userEmail"));
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.WAITING_USER_LEAVED.toString(),
                    "msg", "Lobby 로 돌아갑니다.",
                    "reason", forced ? "KICKED" : "LEAVED"
            ));
            // 2-2. 방이 비어있다면, 삭제한다.
            if(room.getSessions().isEmpty()) {
                socketMetrics.recordRoomDestroyed(room.getGameType().toString());
                log.info("REMOVED ROOM {}", room.getRoomId());
                onlinePlayerManager.removeRoomFromServer(roomId);
                messageSenderManager.sendMessageToUser(session, Map.of(
                        "type", MessageDto.Type.ROOM_LIST.toString(),
                        "roomList", gameServerService.existingRoomList()
                ));
                onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(roomId, leaveUser), false, LobbyUserDto.Status.ON);
                leaveUser.setGrant(UserDto.Grant.NONE);
                return;
            }
            onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(roomId, leaveUser), false, LobbyUserDto.Status.ON);
            onlinePlayerManager.sendUpdateRoomStateToUserOn(room);
            // 2-3. 나간 사람이 방장이라면, 방장 권한을 넘겨준다.
            if(leaveUser.getGrant().equals(UserDto.Grant.MASTER)) {
                log.info("REGRANT Master");
                onlinePlayerManager.regrantRoomMaster(room);
            }
            leaveUser.setGrant(UserDto.Grant.NONE);
            // 현재 사용자가 나가서 그대로 보내면 안됨
            WebSocketSession remainSession = null;
            for(WebSocketSession s : room.getSessions()) {
                if (remainSession != null) break;
                remainSession = s;
            }
            messageSenderManager.sendMessageBroadCast(remainSession, roomId, null, Map.of(
                    "type", MessageDto.Type.WAITING_USER_REMOVED.toString(),
                    "msg", leaveUser.getUserNickname() + "님이 나갔습니다.",
                    "room", room.mappingRoomInfo()
            ));
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ROOM_LIST.toString(),
                    "roomList", gameServerService.existingRoomList()
            ));
        } catch(IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }
    }

    // User 팀 바꾸기
    public void handleUserTeamChange(WebSocketSession session, UserTeamChangeRequestDto teamChangeRequest) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(teamChangeRequest.getRoomId());
            if(!onlinePlayerManager.isAuthorized(session, room)) new IllegalArgumentException("잘못된 요청입니다.");
            log.info("TEAM CHANGE REQUEST : ROOM {} FROM {}", room.getRoomTitle(), teamChangeRequest.getUser().getUserEmail());
            if(!teamChangeRequest.changeTeam(room)) throw new IllegalArgumentException("팀 변경 중 오류가 발생하였습니다.");
            log.info("{} team changed in {}", teamChangeRequest.getUser().getUserEmail(), room.getRoomId());
            messageSenderManager.sendMessageBroadCast(session, teamChangeRequest.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.WAITING_TEAM_CHANGED.toString(),
                    "msg", teamChangeRequest.getUser().getUserNickname()+"님이 팀을 변경하였습니다.",
                    "room", room.mappingRoomInfo()
            ));
        } catch(IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }
    }

    // 유저 READY 상태 변경
    public void handleUserStatus(WebSocketSession session, UserStatusChangeDto request) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
            if (!onlinePlayerManager.isAuthorized(session, room) || room.getRoomMaster().getSession() == session) throw new IllegalArgumentException("잘못된 요청입니다.");
            log.info("USER STATUE CHANGE REQUEST : ROOM {} FROM {}", room.getRoomTitle(), request.getUser().getUserEmail());
            if (!request.changeStatus(room)) throw new IllegalArgumentException("준비상태 변경 중 문제가 발생하였습니다.");
            log.info("{} status changed in {}", request.getUser().getUserEmail(), room.getRoomId());
            messageSenderManager.sendMessageBroadCast(session, request.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.WAITING_READY_CHANGED.toString(),
                    "room", room.mappingRoomInfo()
            ));
        } catch (IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }
    }
    // 유저 강퇴 ( 방장만 )
    public void handleForcedRemoval(WebSocketSession session, RoomMasterForcedRemovalDto request) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
            if(!onlinePlayerManager.isAuthorized(session, room)) throw new IllegalArgumentException("권한이 없습니다.");
            UserDto removeTarget = request.findRemoveTarget(room);
            if(removeTarget == null || removeTarget.getSession() == session) throw new IllegalArgumentException("대상을 확인해주세요.");

            handleLeave(removeTarget.getSession(), request.getRoomId(), true);
            log.info("FORCED REMOVE REQUEST : ROOM {} FROM {}", room.getRoomTitle(), removeTarget.getUserEmail());

        } catch(IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }
    }

    // GAME TYPE CHANGE
    public void handleGameTypeChange(RoomGameTypeChangeRequestDto gameTypeChangeRequest) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(gameTypeChangeRequest.getRoomId());
            if(!onlinePlayerManager.isAuthorized(gameTypeChangeRequest.getRoomMaster().getSession(), room)) throw new IllegalArgumentException("잘못된 요청입니다.");
            if(!onlinePlayerManager.isMaster(gameTypeChangeRequest.getRoomMaster().getSession(), room)) throw new IllegalArgumentException("권한이 없습니다.");

            room.setGameType(gameTypeChangeRequest.getRequestGameType());
            log.info("Room {} was changed {}", room.getRoomId(), room.getGameType().toString());

            messageSenderManager.sendMessageBroadCast(gameTypeChangeRequest.getRoomMaster().getSession(), gameTypeChangeRequest.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.WAITING_GAMETYPE_CHANGED.toString(),
                    "msg", "게임이 변경되었습니다.",
                    "room", room.mappingRoomInfo()
            ));
            onlinePlayerManager.sendUpdateRoomStateToUserOn(room);
        } catch(IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(gameTypeChangeRequest.getRoomMaster().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("{}", e.getMessage());
            throw e;
        }

    }

    // Sending Message
    // 방이 생성되었을 때, GAME 중이 아닌, Lobby 에 있는 상태의 player 들에게 정보 업데이트
    public void broadCastCreateRoomEvent(RoomStateDto room) {
        onlinePlayerManager.getLobby().values().stream().forEach((user) -> {
            if(user.getStatus() == LobbyUserDto.Status.ON) {
                try {
                    messageSenderManager.sendMessageToUser(user.getUser().getSession(), room.mappingSimpleRoomInfo(MessageDto.Type.ROOM_CREATED));
                } catch (Exception e) {
                    log.error("{}", e.getMessage());
                    throw e;
                }
            }
        });
    }
}
