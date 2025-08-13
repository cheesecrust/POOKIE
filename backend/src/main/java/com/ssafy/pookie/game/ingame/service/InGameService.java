package com.ssafy.pookie.game.ingame.service;

import com.ssafy.pookie.game.data.repository.GameKeywordsRepository;
import com.ssafy.pookie.game.info.dto.GameStartDto;
import com.ssafy.pookie.game.ingame.dto.PainterChangeRequest;
import com.ssafy.pookie.game.ingame.dto.PassRequestDto;
import com.ssafy.pookie.game.ingame.dto.SubmitAnswerDto;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.reward.service.RewardService;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.dto.TurnDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.timer.dto.TimerRequestDto;
import com.ssafy.pookie.game.timer.service.GameTimerService;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.LobbyUserStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.webrtc.service.RtcService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.objenesis.instantiator.basic.AccessibleInstantiator;
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

    private final OnlinePlayerManager onlinePlayerManager;
    private final GameKeywordsRepository gameKeywordsRepository;
    private final RtcService rtcService;
    private final MessageSenderManager messageSenderManager;
    private final RewardService rewardService;

    // 게임 시작 -> 방장이 버튼을 눌렀을 때
    public void handleGameStart(WebSocketSession session, GameStartDto request) throws IOException {
        // 현재 방의 상태를 가져옴
        RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
        log.info("GAME START REQUEST : Room {}", room.getRoomId());
        try {
//            // 1. 시작 조건을 확인
            if(!onlinePlayerManager.isMaster(session, room)) throw new IllegalArgumentException("잘못된 요청입니다.");
            room.isPreparedStart();
            // 2. 인원 충족, 모두 준비 완료
            // 게임 시작 설정
            room.setStatus(RoomStateDto.Status.START);
            // 라운드 설정
            if (!increaseRound(session, room)) {
                room.setStatus(RoomStateDto.Status.WAITING);
                throw new IllegalArgumentException("게임 시작 도중 오류가 발생하였습니다.");
            }
            // 턴 설정
            room.turnChange();
            // 게임 정보 설정
            room.getGameInfo().setStartGame();

            // 현재 Session ( Room ) 에 있는 User 의 Lobby Status 업데이트
            // 게임중으로 업데이트
            onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(request.getRoomId(), request.getUser()), true, LobbyUserDto.Status.GAME);
            String rtcToken = rtcService.makeToken(request.getUser().getUserNickname(), request.getUser().getUserAccountId(), request.getRoomId());
            // Client response msg
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.GAME_STARTED,
                    "msg", "게임을 시작합니다.",
                    "turn", room.getTurn().toString(),
                    "round", room.getRound(),
                    "rtc_token", rtcToken,
                    "game_init", Map.of(
                            "score", 0,
                            "teamScore", Map.of(
                                    "RED", 0,
                                    "BLUE", 0
                            ),
                            "win", 0,
                            "keywordIdx", 0
                    )
            ));
            room.updateUserTeamInfo();
            deliverKeywords(room);
            log.info("GAME STARTED : ROOM {}", room.getRoomId());
        } catch (IllegalArgumentException e) {
            log.error("reason : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        }
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
            messageSenderManager.sendMessageToUser(rep.getSession(), room.getGameInfo().mapGameInfoToRep(MessageDto.Type.GAME_KEYWORD.toString()));
        }
        RoomStateDto.Turn opposite = room.getTurn() == RoomStateDto.Turn.RED ? RoomStateDto.Turn.BLUE : RoomStateDto.Turn.RED;
        for(UserDto opp : room.getUsers().get(opposite.toString())) {
            messageSenderManager.sendMessageToUser(opp.getSession(), room.getGameInfo().mapGameInfoToRep(MessageDto.Type.GAME_KEYWORD.toString()));
        }
        log.info("keyword {} was send to {}", keywordList, room.getGameInfo().getRep().stream().map(e -> e.getUserEmail()).collect(Collectors.toList()));
        // samepose 는 nor 에게 전달하지 않고 패스
        if(room.getGameType().equals(RoomStateDto.GameType.SAMEPOSE)) return;
        for(UserDto nor : room.getGameInfo().getNormal()) {
            messageSenderManager.sendMessageToUser(nor.getSession(), room.getGameInfo().mapGameInfoToNor(MessageDto.Type.GAME_KEYWORD.toString()));
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
                rep = Math.min(2, teamUsers.size()-1);
                break;
        }

        room.getGameInfo().setInit();
        List<UserDto> repList = room.getGameInfo().getRep();
        List<UserDto> normalList = room.getGameInfo().getNormal();
        while(room.getGameInfo().getRep().size() < rep) {
            int repIdx = new Random().nextInt(teamUsers.size());
            if(repList.contains(teamUsers.get(repIdx))) continue;
            repList.add(teamUsers.get(repIdx));
        }

        for(UserDto user : teamUsers) {
            if(repList.contains(user) && !room.getGameType().equals(RoomStateDto.GameType.SAMEPOSE)) continue;
            normalList.add(user);
        }
        // 일심동체는 방장이 모든 정답을 제출
        if(room.getGameType().equals(RoomStateDto.GameType.SAMEPOSE) && !normalList.contains(room.getRoomMaster())) {
            normalList.add(room.getRoomMaster());
        }
    }

    // 턴이 종료되었을 때
    public void handleTurnChange(WebSocketSession session, TurnDto gameResult) throws IOException {
        log.info("TURN OVER REQUEST : ROOM {}", gameResult.getRoomId());
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(gameResult.getRoomId());
            if (!onlinePlayerManager.isAuthorized(session, room) || !onlinePlayerManager.isMaster(session, room))
                return;
            // TURN_CHANGE 이벤트는 RED 에서만 일어남
            if (room.getTurn() != RoomStateDto.Turn.RED) throw new IllegalArgumentException("턴 정보가 잘못되었습니다.");
            // 클라이언트와 서버의 데이터를 교차 검증한다.
            if (!room.validationTempScore(gameResult)) {
                gameResult.setScore(room.getTempTeamScores().get(room.getTurn().toString()));
            }
            // 턴 바꿔주기
//            log.info("Room {} turn change", room.getRoomId());
//            log.info("Before turn change : {}", room.mappingRoomInfo());
            room.turnChange();
            // Client response msg
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.GAME_TURN_OVERED.toString(),
                    "msg", room.getTurn()+"팀 차례입니다.",
                    "round", room.getRound(),
                    "turn", room.getTurn().toString(),
                    "tempTeamScore", room.getTempTeamScores()
            ));
//            log.info("After turn change : {}", room.mappingRoomInfo());
            deliverKeywords(room);
            log.info("TURN OVER REQUEST SUCCESS : ROOM {}", gameResult.getRoomId());
        } catch (IllegalArgumentException e) {
            log.error("TURN REQUEST FAIL : ROOM {}", gameResult.getRoomId());
            log.error("REASON : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("TURN OVER REQUEST FAIL : ROOM {}", gameResult.getRoomId());
            log.error("REASON : {}", e.getMessage());
            throw e;
        }
    }

    // 게임 라운드 증가
    public Boolean increaseRound(WebSocketSession session, RoomStateDto room) throws IOException {
        // 현재 대기방의 현재 라운드
        int nowRound = room.getRound();
        // 1. 게임 끝
        if(nowRound == 3) { // 더 이상 진행 불가
            log.info("Room {} Game Over", room.getRoomId());
            // Client response msg
            Map<String, Object> gameResult = room.gameOver();
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.WAITING_GAME_OVER.toString(),
                    "room", room.mappingRoomInfo(),
                    "gameResult", gameResult
            ));
            rewardService.saveReward(room, (String)gameResult.get("win"), 100);
            room.resetAfterGameOver();
            return false;
        }
        // 2. 게임 진행
        room.setRound(nowRound+1);
        return true;
    }

    // 라운드 종료
    public void handleRoundOver(WebSocketSession session, TurnDto gameResult) throws IOException {
        log.info("ROUND OVER REQUEST : ROOM {}", gameResult.getRoomId());
        try {
        /*
            1. 두 팀간 점수를 비교
            2. 승 / 패 구분
            3. RoomStateDto 의 teamScore 갱신 및 tempTeamScore 초기화
            4. GameInfo Reset
            5. Turn 교환
         */
            RoomStateDto room = onlinePlayerManager.getRooms().get(gameResult.getRoomId());
            if(!onlinePlayerManager.isMaster(session, room) || room.getTurn().equals(RoomStateDto.Turn.RED)) throw new IllegalArgumentException("잘못된 요청입니다.");
            // 라운드 끝, 팀별 점수 집계
            // 클라이언트와 서버의 데이터를 교차 검증한다.
            if (!room.validationTempScore(gameResult)) {
                gameResult.setScore(room.getTempTeamScores().get(room.getTurn().toString()));
            }
//            log.info("Before round over : {}", room.mappingRoomInfo());
            room.roundOver();
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null, room.roundResult());
            // 라운드별 점수 초기화
            room.resetTempTeamScore();
            // 라운드 증가, 턴 체인지
            room.turnChange();
            if (!increaseRound(session, room)) {
                room.resetUserTeamInfo();
                onlinePlayerManager.updateLobbyUserStatus(new LobbyUserStateDto(gameResult.getRoomId(), gameResult.getUser()), true, LobbyUserDto.Status.WAITING);
                return;
            }
//            log.info("After round over : {}", room.mappingRoomInfo());
//            log.info("Room {} round over", room.getRoomId());
            // client response message
            messageSenderManager.sendMessageBroadCast(session, room.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.GAME_NEW_ROUND.toString(),
                    "msg", "새로운 라운드가 시작됩니다.",
                    "turn", room.getTurn().toString(),
                    "round", room.getRound(),
                    "teamScore", room.getTeamScores()
            ));
            deliverKeywords(room);
            log.info("ROUND OVER REQUEST SUCCESS : ROOM {}", gameResult.getRoomId());
        } catch(IllegalArgumentException e) {
            log.error("ROUND OVER REQUEST FAIL : ROOM {}", gameResult.getRoomId());
            log.error("REASON : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(session, Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("ROUND OVER REQUEST FAIL : ROOM {}", gameResult.getRoomId());
            log.error("REASON : {}", e.getMessage());
            throw e;
        }
    }
    // Submit Answer ( 정답 제출 )
    public synchronized void handleSubmitAnswer(SubmitAnswerDto request) throws IOException {
        log.info("SUBMIT ANSWER REQUEST : ROOM {}", request.getRoomId());
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
            // 서로 동기화 정보가 다르다면 그냥 버린다.
            // 정답을 맞추는 사람이 아닌 사람이 전송한 데이터라면 버린다
            log.info("USER : {} {} {}", request.getUser().getUserEmail(), room.getTurn(), request.getInputAnswer());
            log.info("NOW : {} {}", room.getTurn(), room.getGameInfo().getKeywordList().get(request.getKeywordIdx()));
            if (!request.getRound().equals(room.getRound()) || !request.getKeywordIdx().equals(room.getGameInfo().getKeywordIdx())
                    || room.getGameInfo().getNormal().stream().filter(
                    (user) -> user.getUserAccountId().equals(request.getNorId())).findFirst().orElse(null) == null) throw new IllegalArgumentException("잘못된 요청입니다.");

            // 정답이 일치하는지 확인한다.
            // 띄어쓰기 필터링
            Boolean isAnswer = room.getGameInfo().getKeywordList().get(request.getKeywordIdx())
                    .equals(request.getInputAnswer().replace(" ", ""));
            // 정답이라면, room 의 gameInfo, teamTeapScores Update
            if (isAnswer) {
                room.updateTempScore();
            }
            messageSenderManager.sendMessageBroadCast(request.getUser().getSession(), request.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.GAME_ANSWER_SUBMITTED.toString(),
                    "answer", isAnswer,
                    "norId", request.getUser().getUserAccountId(),
                    "inputAnswer", request.getInputAnswer(),
                    "msg", room.getTurn().toString() + "팀 " + (isAnswer ? CORRECT : WRONG),
                    "nowInfo", room.getGameInfo().mapGameInfoChange()
            ));
            log.info("SUBMIT ANSWER REQUEST SUCCESS : ROOM {}", request.getRoomId());
        } catch (IllegalArgumentException e) {
            log.error("SUBMIT ANSWER REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("SUBMIT ANSWER REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            throw e;
        }
    }

    public void handlePainterChange(PainterChangeRequest request) throws IOException {
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
            if (!onlinePlayerManager.isAuthorized(request.getUser().getSession(), room) && room.getStatus() != RoomStateDto.Status.START) throw new IllegalArgumentException("잘못된 요청입니다.");
            if(!request.getCurRepIdx().equals(room.getGameInfo().getRepIdx())) throw new IllegalArgumentException("잘못된 요청입니다.");
            log.info("PAINTER CHANGE REQUEST : Room {}", room.getRoomId());
            if (!room.getGameInfo().changePainter()) {
                log.warn("다음 차례가 없습니다.");
                throw new IllegalArgumentException("다음 차례가 없습니다.");
            }

            for (UserDto rep : room.getGameInfo().getRep()) {
                messageSenderManager.sendMessageToUser(rep.getSession(), room.getGameInfo().mapGameInfoToRep(MessageDto.Type.GAME_PAINTER_CHANGED.toString()));
            }
            for (UserDto nor : room.getGameInfo().getNormal()) {
                messageSenderManager.sendMessageToUser(nor.getSession(), room.getGameInfo().mapGameInfoToNor(MessageDto.Type.GAME_PAINTER_CHANGED.toString()));
            }
            RoomStateDto.Turn opposite = room.getTurn() == RoomStateDto.Turn.RED ? RoomStateDto.Turn.BLUE : RoomStateDto.Turn.RED;
            for(UserDto opp : room.getUsers().get(opposite.toString())) {
                messageSenderManager.sendMessageToUser(opp.getSession(), room.getGameInfo().mapGameInfoToNor(MessageDto.Type.GAME_PAINTER_CHANGED.toString()));
            }
            log.info("PAINTER CHANGE REQUEST SUCCESS : Room {}", room.getRoomId());
        } catch (IllegalArgumentException e) {
            log.error("SUBMIT ANSWER REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("SUBMIT ANSWER REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            throw e;
        }
    }

    public void handlePass(PassRequestDto request) throws IOException {
        log.info("PASS REQUEST : ROOM {}", request.getRoomId());
        try {
            RoomStateDto room = onlinePlayerManager.getRooms().get(request.getRoomId());
            if(!onlinePlayerManager.isAuthorized(request.getRequestUser().getSession(), room)) throw new IllegalArgumentException("잘못된 요청입니다.");
            if(room.getGameType() != RoomStateDto.GameType.SILENTSCREAM || !room.getGameInfo().canPassKeyword(request.getRequestUser())) throw new IllegalArgumentException("PASS 도중 오류가 발생하였습니다.");
            messageSenderManager.sendMessageBroadCast(request.getRequestUser().getSession(), request.getRoomId(), null, Map.of(
                    "type", MessageDto.Type.GAME_PASSED.toString(),
                    "msg", "제시어를 패스합니다.",
                    "nowInfo", room.getGameInfo().mapGameInfoChange()
            ));
            log.info("PASS REQUEST SUCCESS : ROOM {}", request.getRoomId());
        } catch (IllegalArgumentException e) {
            log.error("PASS REQUEST REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            messageSenderManager.sendMessageToUser(request.getRequestUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR.toString(),
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("PASS REQUEST REQUEST FAIL : ROOM {}", request.getRoomId());
            log.error("REASON : {}", e.getMessage());
            throw e;
        }
    }
}
