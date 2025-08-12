package com.ssafy.pookie.game.mini.service;

import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.mini.dto.MiniGameLeaveRequestDto;
import com.ssafy.pookie.game.mini.dto.MiniGameOverRequestDto;
import com.ssafy.pookie.game.mini.dto.MiniGameRoomDto;
import com.ssafy.pookie.game.mini.dto.MiniGameScoreUpdateRequestDto;
import com.ssafy.pookie.game.reward.service.RewardService;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.server.service.GameServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MiniGameService {
    // miniGameRooms 사용
    private final OnlinePlayerManager onlinePlayerManager;
    private final RewardService rewardService;
    private final GameServerService gameServerService;

    // 미니게임 입장
    public void handleJoinMiniGameRoom(MiniGameRoomDto request) throws IOException {
        log.info("MINI GAME JOIN REQUEST : {}", request.getUser().getUserEmail());
        try {
            String createdRoomId = UUID.randomUUID().toString();
            if(findRoom(request.getUser().getUserAccountId()) != null) {    // 이전 방 정보가 남아있다면
                onlinePlayerManager.getMiniGameRooms().remove(request.getUser().getUserAccountId());
                log.info("REMOVE PREV ROOM : {}", request.getUser().getUserEmail());
            }
            request.setRoomId(createdRoomId);
            onlinePlayerManager.getMiniGameRooms().put(request.getUser().getUserAccountId(), request);
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.MINIGAME_JOINED.toString(),
                    "msg", "미니게임으로 이동합니다.",
                    "room", request.mapMiniGameRoom()
            ));
            log.info("MINI GAME JOIN REQUEST : SUCCESS");
        } catch(Exception e) {
            log.error("MINI GAME JOIN ERROR : {}", e.getMessage());
            throw e;
        }
    }
    // 점수 갱신
    public void handleUpdateMiniGameScore(MiniGameScoreUpdateRequestDto request) throws IOException {
        log.info("MINI GAME SCORE REQUEST : {}", request.getUser().getUserEmail());
        try {
            MiniGameRoomDto miniGameRoom = findRoom(request.getUser().getUserAccountId());
            if(miniGameRoom == null) throw new IllegalArgumentException("잘못된 요청입니다.");
            miniGameRoom.updateScore(request.getScore());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.MINIGAME_SCORE_UPDATED.toString(),
                    "room", miniGameRoom.mapMiniGameRoom()
            ));
        } catch(IllegalArgumentException e) {
            log.error("MINI GAME SCORE ERROR : {}", e.getMessage());
            throw e;
        } catch(Exception e) {
            log.error("MINI GAME SCORE ERROR : {}", e.getMessage());
            throw e;
        }
    }
    // 미니게임 종료
    public void handleMiniGameOver(MiniGameOverRequestDto request) throws IOException {
        log.info("MINI GAME OVER REQUEST : {}", request.getUser().getUserEmail());
        try {
            MiniGameRoomDto miniGameRoom = findRoom(request.getUser().getUserAccountId());
            if(miniGameRoom == null) throw new IllegalArgumentException("잘못된 요청입니다.");
            if(miniGameRoom.isPassed()) rewardService.miniGameReward(request.getUser());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.MINIGAME_OVERD.toString(),
                    "room", miniGameRoom.mapMiniGameRoom(),
                    "result", miniGameRoom.isPassed() ? "성공" : "실패"
            ));
            miniGameRoom.gameOver();
        } catch(IllegalArgumentException e) {
            log.error("MINI GAME OVER ERROR : {}", e.getMessage());
            throw e;
        } catch(Exception e) {
            log.error("MINI GAME OVER ERROR : {}", e.getMessage());
            throw e;
        }
    }

    public void handleMiniGameLeave(MiniGameLeaveRequestDto request) throws IOException {
        log.info("MINI GAME SCORE REQUEST : {}", request.getUser().getUserEmail());
        try {
            MiniGameRoomDto miniGameRoom = findRoom(request.getUser().getUserAccountId());
            if(miniGameRoom == null) throw new IllegalArgumentException("잘못된 요청입니다.");
            onlinePlayerManager.getMiniGameRooms().remove(request.getUser().getUserAccountId());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.MINIGAME_LEAVED.toString(),
                    "msg", "Lobby 로 이동합니다."
            ));
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ROOM_LIST.toString(),
                    "roomList", gameServerService.existingRoomList()
            ));
        } catch(IllegalArgumentException e) {
            log.error("MINI GAME SCORE ERROR : {}", e.getMessage());
            throw e;
        } catch(Exception e) {
            log.error("MINI GAME SCORE ERROR : {}", e.getMessage());
            throw e;
        }
    }

    private MiniGameRoomDto findRoom(Long userAccountId) {
        return onlinePlayerManager.getMiniGameRooms().get(userAccountId);
    }
}
