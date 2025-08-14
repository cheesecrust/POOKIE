package com.ssafy.pookie.game.exception.room;

import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.room.service.GameRoomService;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomExceptionService {

    private final GameRoomService gameRoomService;
    private final OnlinePlayerManager onlinePlayerManager;

    public void moveToNewRoom(RoomStateDto prevRoom) throws IOException {
        log.info("MOVE TO NEW ROOM START");

        String prevRoomId = prevRoom.getRoomId();
        String newRoomId = null;

        try {
            // 1. 방장 이동
            JoinDto joinDto = JoinDto.builder()
                    .roomTitle(prevRoom.getRoomTitle())
                    .gameType(prevRoom.getGameType())
                    .roomPw(prevRoom.getRoomPw())
                    .build();
            joinDto.setUser(prevRoom.getRoomMaster());

            gameRoomService.handleJoin(prevRoom.getRoomMaster().getSession(), joinDto);
            newRoomId = findNewRoomIdByUserId(prevRoom.getRoomMaster().getUserAccountId());
            if (newRoomId == null || newRoomId.isEmpty()) {
                throw new IllegalArgumentException("새 방 생성 후 방 ID를 찾을 수 없습니다.");
            }
            joinDto.setRoomId(newRoomId);

            // 2. 일반 유저 이동
            for (String team : prevRoom.getUsers().keySet()) {
                for (UserDto user : prevRoom.getUsers().get(team)) {
                    if (user.getUserAccountId().equals(prevRoom.getRoomMaster().getUserAccountId())) continue;
                    joinDto.setUser(user);
                    gameRoomService.handleJoin(user.getSession(), joinDto);
                }
            }

            // 3. 기존 팀 복원
            returnOriginTeam(onlinePlayerManager.getRooms().get(newRoomId));

            sendRoomUpdate(newRoomId);
            removePrevRoom(prevRoomId);

            log.info("MOVE TO NEW ROOM SUCCESS");

        } catch (Exception e) {
            log.error("MOVE TO NEW ROOM FAIL : {}", e.getMessage(), e);
            // Fallback: 실패 시 기존 세션 닫지 말고 안내 메시지 전송
            for (WebSocketSession session : prevRoom.getSessions()) {
                try {
                    onlinePlayerManager.sendToMessageUser(session, Map.of(
                            "type", MessageDto.Type.ERROR,
                            "msg", "방 이동 중 문제가 발생했습니다. 대기실로 돌아갑니다."
                    ));
                } catch (Exception ignore) {}
            }
        }
    }

    private String findNewRoomIdByUserId(Long userId) {
        for (String roomId : onlinePlayerManager.getRooms().keySet()) {
            if (onlinePlayerManager.getRooms().get(roomId).getRoomMaster().getUserAccountId().equals(userId)) {
                return roomId;
            }
        }
        return null;
    }

    private void removePrevRoom(String roomId) {
        onlinePlayerManager.getRooms().remove(roomId);
    }

    private void returnOriginTeam(RoomStateDto room) {
        try {
            Map<String, List<UserDto>> usersCopy = new HashMap<>();
            for (String team : room.getUsers().keySet()) {
                usersCopy.put(team, new ArrayList<>(room.getUsers().get(team)));
            }

            for (String team : usersCopy.keySet()) {
                for (UserDto user : usersCopy.get(team)) {
                    String originTeam = user.getTeam().toString();
                    if (!team.equals(originTeam)) {
                        room.getUsers().get(team).remove(user);
                        room.getUsers().get(originTeam).add(user);
                    }
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("방 이동 중 팀 배정 과정에서 오류가 발생하였습니다.", e);
        }
    }

    private void sendRoomUpdate(String roomId) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(roomId);
        if (room == null) return;
        for (WebSocketSession session : room.getSessions()) {
            onlinePlayerManager.sendToMessageUser(session, Map.of(
                    "type", MessageDto.Type.WAITING_ROOM_UPDATE.toString(),
                    "room", room.mappingRoomInfo()
            ));
        }
    }
}
