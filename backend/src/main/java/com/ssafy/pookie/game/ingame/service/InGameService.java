package com.ssafy.pookie.game.ingame.service;

import com.ssafy.pookie.game.data.repository.GameKeywordsRepository;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.game.ingame.dto.SubmitAnswerDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.LobbyUserStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class InGameService {
    private final String CORRECT = "정답입니다.";
    private final String WRONG = "오답입니다.";

    // TODO 모든 이벤트는 방장으로부터 오는지
    private final OnlinePlayerManager onlinePlayerManager;
    private final GameKeywordsRepository gameKeywordsRepository;

    // TODO GameServerService 에서 분리해오기
    // 게임 시작 -> 방장이 버튼을 눌렀을 때
    public void hadleGameStart(WebSocketSession session, GameStartDto request) throws IOException {
        // 현재 방의 상태를 가져옴
        RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
        // 방이 존재하지 않음, 또는 해당 방에 있는 참가자가 아님, 방장이 아님
        if(onlinePlayerManager.isAuthorized(session, room) || room.getRoomMaster().getSession() != session) return;
        // 1. 방 인원이 모드 채워졌는지
        if(room.getSessions().size() < 6) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", "ERROR",
                    "msg", "6명 이상 모여야 시작 가능합니다."
            ));
            return;
        }
        if(room.getSessions().size() <= 6) {
            // 모두 준비 완료 상태인지
            int readyUserCnt = 0;
            List<UserDto> teamUsers = room.getUsers().get("RED");
            int redTeamCnt = teamUsers.size();
            readyUserCnt += (int)teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();
            teamUsers = room.getUsers().get("BLUE");
            int blueTeamCnt = teamUsers.size();
            readyUserCnt += (int)teamUsers.stream().filter((user) -> user.getStatus() == UserDto.Status.READY).count();
            if(redTeamCnt != blueTeamCnt) {
                onlinePlayerManager.sendToMessageUser(session, Map.of(
                        "type", "ERROR",
                        "msg", "팀원이 맞지 않습니다."
                ));
                return;
            }
            log.info("Room {}, 총인원 : {}, 준비완료 : {}", room.getRoomTitle(), room.getSessions().size(), readyUserCnt);
            if(readyUserCnt != room.getSessions().size()) {
                onlinePlayerManager.sendToMessageUser(session, Map.of(
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
        if(!increaseRound(session, room)) return;
        // 턴 설정
        room.turnChange();
        // 게임 정보 설정
        room.getGameInfo().setStartGame();

        log.info("Room {} Game Start", room.getRoomId());
        log.info("State : {}", room.mappingRoomInfo());
        // 현재 Session ( Room ) 에 있는 User 의 Lobby Status 업데이트
        // 게임중으로 업데이트
        onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(request.getRoomId(), request.getUser()), true, LobbyUserDto.Status.GAME);

        // Client response msg
        onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                "type", "STARTED_GAME",
                "msg", "게임을 시작합니다.",
                "turn", room.getTurn().toString()
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
        List<String> keywordList = gameKeywordsRepository.findByIdIn(tempKeywordSet)
                .stream().map(e -> e.getWord()).collect(Collectors.toList());
        // 키워드 목록 저장
        room.getGameInfo().setKeywordList(keywordList);
        for(UserDto rep : room.getGameInfo().getRep()) {
            onlinePlayerManager.sendToMessageUser(rep.getSession(), Map.of(
                    "type", "KEYWORD",
                    "Keywords", keywordList,
                    "keywordIdx", room.getGameInfo().getKeywordIdx()
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
        Integer rep = null;

        switch (room.getGameType().toString()) {
            case "SAMEPOSE":
                rep = teamUsers.size();
                break;
            case "SILENTSCREAM":
                rep = 1;
                break;
            case "SKETCHRELAY":
                rep = teamUsers.size()-1;
                break;
        }

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
        RoomStateDto room = onlinePlayerManager.getRooms().get(result.getRoomId());
        if(onlinePlayerManager.isAuthorized(session, room) || room.getRoomMaster().getSession() != session) return;
        // TURN_CHANGE 이벤트는 RED 에서만 일어남
        if(room.getTurn() != RoomStateDto.Turn.RED) return;
        // 현재 라운드 점수 기록
        room.writeTempTeamScore(result);
        // 턴 바꿔주기
        room.turnChange();
        log.info("Room {} turn change", room.getRoomId());
        log.info("{}", room.mappingRoomInfo());
        // Client response msg
        onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                "type", "TURN_CHANGED",
                "turn", room.getTurn().toString()
        ));
        deliverKeywords(room);
    }

    // 게임 라운드 증가
    public Boolean increaseRound(WebSocketSession session, RoomStateDto room) throws IOException {
        // 현재 대기방의 현재 라운드
        int nowRound = room.getRound();
        // 1. 게임 끝
        if(nowRound == 3) { // 더 이상 진행 불가
            log.info("Room {} Game Over", room.getRoomId());
            room.resetAfterGameOver();
            // Client response msg
            onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                    "type", "GAME_OVER",
                    "room", room.mappingRoomInfo(),
                    "gameResult", room.gameOver()
            ));
            return false;
        }
        // 2. 게임 진행
        room.setRound(nowRound+1);
        return true;
    }

    // 라운드 종료
    public void handleRoundOver(WebSocketSession session, TurnDto gameResult) throws IOException {
        /*
            1. 두 팀간 점수를 비교
            2. 승 / 패 구분
            3. RoomStateDto 의 teamScore 갱신 및 tempTeamScore 초기화
            4. GameInfo Reset
            5. Turn 교환
         */
        RoomStateDto room = onlinePlayerManager.getRooms().get(gameResult.getRoomId());
        // 라운드 끝, 팀별 점수 집계
        room.writeTempTeamScore(gameResult);
        room.roundOver();
        onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null, room.roundResult());
        // 라운드별 점수 초기화
        room.resetTempTeamScore();
        // 라운드 증가, 턴 체인지
        room.turnChange();
        if(!increaseRound(session ,room)) {
            onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(gameResult.getRoomId(), gameResult.getUser()), true, LobbyUserDto.Status.WAITING);
            return;
        }

        log.info("Room {} round over", room.getRoomId());
        // client response message
        onlinePlayerManager.broadCastMessageToRoomUser(session, room.getRoomId(), null, Map.of(
                "type", "NEW_ROUND",
                "msg", "새로운 라운드가 시작됩니다.",
                "turn", room.getTurn().toString()
        ));
        deliverKeywords(room);
    }
    // Submit Answer ( 정답 제출 )
    public synchronized void handleSubmitAnswer(SubmitAnswerDto request) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
        if(!isMasterRequest(request.getUser().getSession(), room)) {
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", "ERROR",
                    "msg", "잘못된 요청입니다."
            ));
        }

        // 서로 동기화 정보가 다르다면 그냥 버린다.
        if(request.getRound().equals(room.getRound()) || request.getKeywordIdx().equals(room.getGameInfo().getKeywordIdx())
                || request.getRepIdx().equals(room.getGameInfo().getRepIdx())) return;

        // 정답이 일치하는지 확인한다.
        Boolean isAnswer = room.getGameInfo().getKeywordList().get(request.getKeywordIdx())
                .equals(request.getInputAnswer());
        // 정답이라면, room 의 gameInfo, teamTeapScores Update
        if(isAnswer) {
            room.updateTempScore();
        }
        onlinePlayerManager.broadCastMessageToRoomUser(request.getUser().getSession(), request.getRoomId(), null, Map.of(
                "type", "ANSWER_RESULT",
                "answer", isAnswer,
                "msg", room.getTurn().toString()+"팀 "+ (isAnswer ? CORRECT : WRONG)
        ));
    }

    // 들어오는 요청이 방장이 보낸 요청인지 확인
    public Boolean isMasterRequest(WebSocketSession requestSession, RoomStateDto room) {
        return room != null && room.getRoomMaster().getSession() == requestSession;
    }
}
