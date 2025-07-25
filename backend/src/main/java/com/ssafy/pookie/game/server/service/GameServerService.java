package com.ssafy.pookie.game.server.service;

import com.fasterxml.classmate.members.RawMember;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.data.model.GameKeywords;
import com.ssafy.pookie.game.data.repository.GameKeywordsRepository;
import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomMasterForcedRemovalDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.game.user.dto.UserStatusChangeDto;
import com.ssafy.pookie.game.user.dto.UserTeamChangeRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameServerService {

    private final GameKeywordsRepository gameKeywordsRepository;

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
            } else {
                removeFromLobby(isExist.getSession());
                log.warn("Duplicated user : {}", isExist.getUser().getUserId());
            }
        }

        // lobby 로 이동시킴
        LobbyUserDto lobbyUserDto = new LobbyUserDto(session, userDto);
        lobbyUserDto.setStatus(LobbyUserDto.Status.ON);
        lobby.put(userDto.getUserId(), lobbyUserDto);
        log.info("User {} entered lobby", userDto.getUserNickname());

        // TODO DB 구축 시 User ON/OFF 상태 변경

        // ToClient
        sendToMessageUser(session, Map.of(
                "type", "ON",
                "msg", "연결되었습니다.",
                "user", userDto
        ));
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

            return newRoom;
        });
        if(!room.getGameType().toString().equals(joinDto.getGameType().toString())) {
            log.warn("Room GameType does not match");
            sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "GameType이 일치하지 않습니다."
            ));
            return;
        }

        // 비밀번호 확인
        if((room.getRoomPw() != null || !room.getRoomPw().isEmpty()) &&
        !room.getRoomPw().equals(joinDto.getRoomPw())) {
            log.warn("Room Password Mismatch");
            sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "비밀번호가 틀렸습니다."
            ));
            return;
        }

        // 신규 유저의 팀 배정
        // 일반 플레이어 -> Default 는 Ready 상태
        joinDto.setTeam(room.assignTeamForNewUser());
        if(joinDto.getUser().getGrant() == UserDto.Grant.NONE) {
            joinDto.getUser().setStatus(UserDto.Status.READY);
            joinDto.getUser().setGrant(UserDto.Grant.PLAYER);
        }
        // 세션 설정
        // 게임 설정
        // 각 팀에 유저 배치
        room.getUsers().computeIfAbsent(joinDto.getTeam(), k -> new ArrayList<>())
                .add(joinDto.getUser());

        room.getSessions().add(session);
        log.info("User {} joined room {}", joinDto.getUser().getUserNickname(), room.getRoomId());
        // Client response msg
        broadCastMessageToRoomUser(session, room.getRoomId(), null,
                Map.of(
                        "type", "JOIN",
                        "room", room,
                        "msg", joinDto.getUser().getUserId()+"가 입장하였습니다."
                ));
    }

    // User 가 Room 을 떠날 때
    public void handleLeave(WebSocketSession session, String roomId) throws IOException {
        RoomStateDto room = rooms.get(roomId);
        if(room == null || !room.getSessions().contains(session)) return;
        String leaveUserNickName = "";
        // 해당 룸에서 세션과 유저 제거
        boolean find = false;
        for(String team : room.getUsers().keySet()) {
            List<UserDto> teamUsers = room.getUsers().get(team);
            for(UserDto teamUser : teamUsers) {
                if(teamUser.getSession() == session) {
                    sendToMessageUser(session, Map.of(
                            "type", "LEAVE",
                            "msg", "Lobby 로 돌아갑니다."
                    ));
                    find = true;
                    room.getSessions().remove(session);
                    room.getUsers().get(team).remove(teamUser);

                    // 방에 아무도 남지 않은 경우 -> 방 삭제
                    if(room.getSessions().isEmpty()) {
                        removeRoomFromServer(roomId);
                        return;
                    }

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
            sendToMessageUser(teamSession, Map.of(
                    "type", "LEAVE",
                    "room", room,
                    "msg", leaveUserNickName + "가 나갔습니다."
            ));
        }
    }

    /*
        유저를 대기방에서 제거
     */
    public void removeSessionFromRooms(WebSocketSession session) throws IOException {
        rooms.values().forEach(room -> {
            try {
                if (room.getSessions().contains(session)) {
                    handleLeave(session, room.getRoomId());
                }
            } catch (Exception e) {
                log.error(e.getMessage());
            }
        });
    }
    // 방장 재배정
    public void regrantRoomMaster(RoomStateDto room) {
        Map<String, List<UserDto>> user = room.getUsers();
        String[] team = {"RED", "BLUE"};
        int teamIdx = new Random().nextInt(2);
        int playerIdx = new Random().nextInt(user.get(team[teamIdx]).size());

        if(user.get(team[teamIdx]).size() <= playerIdx) {
            teamIdx = (teamIdx+1)%2;
        }
        user.get(team[teamIdx]).get(playerIdx).setGrant(UserDto.Grant.MASTER);
        room.setRoomMaster(user.get(team[teamIdx]).get(playerIdx));
    }
    // 방 삭제
    public void removeRoomFromServer(String roomId) {
        rooms.remove(roomId);
    }

    // User 팀 바꾸기
    public void handleUserTeamChange(WebSocketSession session, UserTeamChangeRequestDto teamChangeRequest) throws IOException {
        System.out.println(teamChangeRequest);
        RoomStateDto room = rooms.get(teamChangeRequest.getRoomId());
        if(room == null || !room.getSessions().contains(session)) return;
        System.out.println(room);
        String fromTeam = teamChangeRequest.getFromTeam().toString();
        String toTeam = teamChangeRequest.getToTeam().toString();

        for(UserDto user : room.getUsers().get(teamChangeRequest.getFromTeam().toString())) {
            if(user.getSession() == teamChangeRequest.getUser().getSession()) {
                room.getUsers().get(fromTeam).remove(user);
                room.getUsers().get(toTeam).add(user);
                break;
            }
        }

        broadCastMessageToRoomUser(session, teamChangeRequest.getRoomId(), null, Map.of(
                "type", "TEAM_CHANGE",
                "msg", teamChangeRequest.getUser().getUserNickname()+"이 팀을 변경하였습니다.",
                "room", room
        ));
    }

    // 유저 READY 상태 변경
    public void handleUserStatus(WebSocketSession session, UserStatusChangeDto request) throws IOException {
        RoomStateDto room = rooms.get(request.getRoomId());
        if(room == null || !room.getSessions().contains(session) || room.getRoomMaster().getSession() == session) return;

        UserDto.Status status;
        if(request.isReady()) {
            status = UserDto.Status.READY;
        } else {
            status = UserDto.Status.NONE;
        }

        String userNickname = null;
        for(UserDto user : room.getUsers().get(request.getTeam())) {
            if(user.getSession() == session) {
                user.setStatus(status);
                userNickname = user.getUserNickname();
            }
        }

        broadCastMessageToRoomUser(session, request.getRoomId(), null, Map.of(
                "type", "USER_READY_CHANGE",
                "msg", userNickname+" 준비"+ (request.isReady() ? "완료" : "해제"),
                "room", room
        ));
    }
    // 유저 강퇴 ( 방장만 )
    public void handleForcedRemoval(WebSocketSession session, RoomMasterForcedRemovalDto request) throws IOException {
        RoomStateDto room = rooms.get(request.getRoomId());
        if(room == null || !room.getSessions().contains(session)) return;

        // 방장인지 확인
        if(room.getRoomMaster().getSession() != session) return;

        UserDto removeTarget = room.getUsers().get(request.getRemoveTargetTeam()).stream()
                .filter((user) -> user.getUserId().equals(request.getRemoveTargerId())).findFirst()
                .orElse(null);
        if(removeTarget == null) {
            sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "대상을 확인해주세요."
            ));
            return;
        }
        WebSocketSession removeTargetSession = removeTarget.getSession();
        // 방장이 방장을 강퇴하는 경우 방지
        if(session == removeTargetSession) {
            sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "대상을 확인해주세요."
            ));
            return;
        }

        handleLeave(removeTargetSession, request.getRoomId());
    }

    // GAME_PROCESS

    // 게임 시작 -> 방장이 버튼을 눌렀을 때
    public void hadleGameStart(WebSocketSession session, JoinDto roomMaster) throws IOException {
        // 현재 방의 상태를 가져옴
        RoomStateDto room = rooms.get(roomMaster.getRoomId());
        // 방이 존재하지 않음, 또는 해당 방에 있는 참가자가 아님, 방장이 아님
        if(room == null || !room.getSessions().contains(session) || room.getRoomMaster().getSession() != session ) return;
        // 1. 방 인원이 모드 채워졌는지
        if(room.getSessions().size() < 6) {
            session.sendMessage(new TextMessage("Required over 6 users"));
            return;
        }
        if(room.getSessions().size() <= 6) {
            // 모두 준비 완료 상태인지
            int readyUserCnt = 0;
            List<UserDto> teamUsers = room.getUsers().get("RED");
            readyUserCnt += (int)teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();
            teamUsers = room.getUsers().get("BLUE");
            readyUserCnt += (int)teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();
            log.info("Room {}, 총인원 : {}, 준비완료 : {}", room.getRoomId(), room.getSessions().size(), readyUserCnt);
            if(readyUserCnt != room.getSessions().size()) {
                sendToMessageUser(session, Map.of(
                        "type", "ERROR",
                        "msg", "준비완료가 되지 않았습니다."
                ));
                return;
            }
        }

        // 2. 인원 충족, 모두 준비 완료
        // 게임 시작 설정
        room.setStatus(RoomStateDto.Status.START);
        // 라운드 설정
        increaseRound(room);
        // 턴 설정
        turnChange(room);
        // 키워드셋 설정
        room.getGameInfo().setKeywordSet(new HashSet<>());
        log.info("RoomState : {}", room);
        // 현재 Session ( Room ) 에 있는 User 의 Lobby Status 업데이트
        // 게임중으로 업데이트
        updateLobbyUserStatus(roomMaster, true, LobbyUserDto.Status.GAME);
//        for(String team : room.getUsers().keySet()) {
//            for(UserDto user : room.getUsers().get(team)) {
//                log.info("{} : {}", lobby.get(user.getUserId()), lobby.get(user.getUserId()).getStatus());
//            }
//        }
        // Client response msg
        broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                "type", "GAME_START",
                "msg", "게임을 시작합니다."
        ));

        deliverKeywords(room);
    }

    // 제시어를 전달
    public void deliverKeywords(RoomStateDto room) throws IOException{
        pickTeamRep(room);
        /*
            일심 동체, 이어그리기 : 1 개
            고요속의 외침 제시어 : 10 ~ 15 개
         */
        // DB 에서 게임 키워드 가져오기, 게임 종류에 따라 키워드가 다름
        int keywordCnt = room.getGameType() == RoomStateDto.GameType.SILENTSCREAM ?
        15 : 1;
        // DB 에서 전체 키워드의 개수 추출
        Long keywordSetCnt = gameKeywordsRepository.countByGameName(room.getGameType().toString());
        Set<Long> keywordSet = room.getGameInfo().getKeywordSet();
        Set<Long> tempKeywordSet = new HashSet<>();
        while(tempKeywordSet.size() < keywordCnt) {
            Long pkIdx = new Random().nextLong(keywordSetCnt)+1;

            if(!keywordSet.add(pkIdx)) continue;
            tempKeywordSet.add(pkIdx);
        }
        // DB 로 tempKeywordSet 전송하여 제시어 set 받아옴
        // 제시어 set client 로 전달
        List<GameKeywords> keywordList = gameKeywordsRepository.findByIdIn(tempKeywordSet);

        for(UserDto rep : room.getGameInfo().getRep()) {
            sendToMessageUser(rep.getSession(), Map.of(
                    "type", "KEYWORD",
                    "Keywords", keywordList
            ));
        }
    }
    // 현재 팀의 대표자 뽑기 ( 발화자 )
    public void pickTeamRep(RoomStateDto room) {
        // 현재 턴의 팀
        List<UserDto> teamUsers = room.getUsers().get(room.getTurn().toString());

        // 대표지
        // 이어그리기 n-1 명
        // 나머지 1 명
        int rep = room.getGameType() == RoomStateDto.GameType.SKETCHRELAY ?
                teamUsers.size()-1 : 1;
        room.getGameInfo().setInit();
        List<UserDto> reqList = room.getGameInfo().getRep();
        List<UserDto> normalList = room.getGameInfo().getNormal();
        while(room.getGameInfo().getRep().size() < rep) {
            int repIdx = new Random().nextInt(teamUsers.size());
            if(reqList.contains(teamUsers.get(repIdx))) continue;
            reqList.add(teamUsers.get(repIdx));
        }

        for(UserDto user : teamUsers) {
            if(reqList.contains(user)) continue;
            normalList.add(user);
        }
    }

    // 턴이 종료되었을 때
    public void handleTurnChange(WebSocketSession session, TurnDto result) throws IOException {
        RoomStateDto room = rooms.get(result.getRoomId());
        if(room == null || !room.getSessions().contains(session)) return;
        // 현재 라운드 점수 기록
        writeTempTeamScore(result, room);
        // 턴 바꿔주기
        turnChange(room);
        log.info("Turn Change\n Room : {}", room);
        // Client response msg
        broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                "type", "TURN_CHANGE",
                "room", room
        ));
        deliverKeywords(room);
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

    // 라운드 종료
    public void handleRoundOver(WebSocketSession session, TurnDto gameResult) {

    }

    // 현재 방에 있는 유저들에게 BraodCast
    // 메시지 전달 유형
    // 1. 해당 팀원들에게만
    // 2. 해당 대기방 전체
    public void broadCastMessageToRoomUser(WebSocketSession session, String roomId, String team, Map<String, Object> msg) throws IOException {
        RoomStateDto room = rooms.get(roomId);
        if(room == null || !room.getSessions().contains(session)) return;

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

    /*
        특정 유저에게만 Message 전달
     */
    public void sendToMessageUser(WebSocketSession session, Map<String, Object> msg) throws IOException {
        log.info("sendMessage {} : {}", session, msg);
        session.sendMessage(new TextMessage(new ObjectMapper().writeValueAsString(msg)));
    }
}
