package com.ssafy.pookie.game.server.manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.game.ingame.service.InGameService;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.LobbyUserStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.metrics.SocketMetrics;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
@Component
@Getter
@Slf4j
public class OnlinePlayerManager {
    private final UserAccountsRepository userAccountsRepository;
    private final ConcurrentHashMap<String, RoomStateDto> rooms = new ConcurrentHashMap<>();    // <roomId, RoomStateDto>
    private final ConcurrentHashMap<Long, LobbyUserDto> lobby = new ConcurrentHashMap<>();    // <userAccountId, LobbyUserDto>
    private final SocketMetrics socketMetrics;

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
    public void broadCastMessageToRoomUser(WebSocketSession session, String roomId, String team, Map<String, Object> msg) throws IOException {
        RoomStateDto room = this.rooms.get(roomId);
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
        log.info("Request Session : {}", session.getAttributes().get("userEmail"));
        log.info("Request Room : {}", room.mappingSimpleRoomInfo(MessageDto.Type.LOG));
        return room != null && room.isIncluded(session);
    }

    /*
        해당 요청이 방장이 보낸 요청이 맞는지
        방장 O : true
        방장 X : false
     */
    public Boolean isMaster(WebSocketSession session, RoomStateDto room) {
        return room.getRoomMaster().getSession()==session;
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

    public LobbyUserDto getMemberInLobby(Long userAccountId) {
        return lobby.get(userAccountId);
    }

    /*
        현재 세션에 해당 유저가 있는지 확인
     */
    public LobbyUserDto isExistLobby(UserDto user) {
        return lobby.get(user.getUserAccountId());
    }

    // 유저를 세션 및 대기방에서 제거
    /*
        유저를 세션에서 제거
        session id를 가지고 userDto를 가져와서 이를 이용해서 offline과 user email로 제거
     */
    public void removeFromLobby(WebSocketSession session) throws IOException {
        removeSessionFromRooms(session);
        Long userAccountId = (Long) session.getAttributes().get("userAccountId");
        getLobby().remove(userAccountId);

        // offline 처리
        UserAccounts userAccount = userAccountsRepository.findById(userAccountId)
                .orElseThrow(() -> new IOException("getLobbyUser: user account not found"));
        userAccount.updateOnline(false);
        userAccountsRepository.save(userAccount);

        session.close(CloseStatus.POLICY_VIOLATION);
    }

    /*
        현재 유저 ( Session ) 이 속해있는 방에서 유저를 제거한다.
     */
    public void removeSessionFromRooms(WebSocketSession session) {
        this.rooms.values().forEach((room) -> {
            if(room.getSessions().contains(session)) {
                UserDto leaveUser = room.removeUser(session);
                if(room.getSessions().isEmpty()) {
                    socketMetrics.recordRoomDestroyed(room.getGameType().toString());
                    removeRoomFromServer(room.getRoomId());
                } else {
                    // 2-3. 나간 사람이 방장이라면, 방장 권한을 넘겨준다.
                    if(leaveUser.getGrant().equals(UserDto.Grant.MASTER)) {
                        log.info("REGRANT Master");
                        regrantRoomMaster(room);
                    }
                    room.getSessions().forEach((s) -> {
                        try {
                            sendToMessageUser(s, Map.of(
                                    "type", MessageDto.Type.WAITING_USER_REMOVED.toString(),
                                    "msg", "방안의 새로고침 발생",
                                    "room", room.mappingRoomInfo()
                            ));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
                    // 게임중이라면 종료
                    if(room.getStatus().equals(RoomStateDto.Status.START)) {
                            room.getSessions().forEach((s) -> {
                                try {
                                    sendToMessageUser(s, Map.of(
                                            "type", "INTERRUPT",
                                            "msg", session.getAttributes().get("nickname") + "가 게임을 나갔습니다.\n 게임이 종료됩니다."
                                    ));
                                    sendToMessageUser(s, Map.of(
                                            "type", MessageDto.Type.WAITING_GAME_OVER.toString(),
                                            "room", room.mappingRoomInfo(),
                                            "gameResult", room.gameOver()
                                    ));
                                    room.resetAfterGameOver();
                                } catch (IOException e) {
                                    throw new RuntimeException(e);
                                }
                            });
                    }

                    sendUpdateRoomStateToUserOn(room);
                }
            }
        });
    }

    // 방 삭제
    public void removeRoomFromServer(String getRoomId) {
        RoomStateDto room = this.rooms.get(getRoomId);
        this.lobby.values().stream().forEach((user) -> {
            if(user.getStatus() == LobbyUserDto.Status.ON) {
                try {
                    sendToMessageUser(user.getUser().getSession(), Map.of(
                            "type", MessageDto.Type.ROOM_REMOVED.toString(),
                            "room", Map.of(
                                    "roomId", room.getRoomId()
                            )));
                    this.rooms.remove(getRoomId);
                    log.info("Room {} was disappeared", room.getRoomId());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    // 방 정보가 업데이트 된다면, LOBBY 의 ON 상태의 유저들에게 전달해야한다.
    public void sendUpdateRoomStateToUserOn(RoomStateDto room) {
        this.lobby.keySet().forEach((userAccountId) -> {
            LobbyUserDto user = this.lobby.get(userAccountId);
            if(user.getStatus() == LobbyUserDto.Status.ON) {
                try {
                    sendToMessageUser(user.getUser().getSession(), room.mappingSimpleRoomInfo(MessageDto.Type.ROOM_UPDATE));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });
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

    public boolean isInvalid(WebSocketSession session) {
        return this.lobby.contains(session.getAttributes().get("userAccountId"));
    }
}
