package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.FollowRequestDto;
import com.ssafy.pookie.game.room.dto.JoinDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {
    private final OnlinePlayerManager onlinePlayerManager;
    private final GameRoomService gameRoomService;
    public void handleFollow(FollowRequestDto request) throws IOException {
        log.info("Follow Request : {}", request.getUser().getUserNickname());
        try {
            UserDto targetUser = isAuthorization(request.getUserId());
            if(targetUser==null) throw new IllegalArgumentException("대상 유저가 접속중이 아닙니다.");
            RoomStateDto targetRoom = findRoom(targetUser.getSession());
            if(targetRoom == null) throw new IllegalArgumentException("대상이 대기방에 없습니다.");
            gameRoomService.handleJoin(request.getUser().getSession(), mapJoinRequest(targetRoom, request.getUser()));
            log.info("Follow Request SUCCESS : {}", request.getUser().getUserNickname());
        } catch (IllegalArgumentException e) {
            log.error("Follow Request FAIL: {}", request.getUser().getUserNickname());
            log.error("REASON : {}", e.getMessage());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR,
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Follow Request FAIL: {}", request.getUser().getUserNickname());
            log.error("REASON : {}", e.getMessage());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR,
                    "msg", e.getMessage()
            ));
        }
    }

    private LobbyUserDto findUser(Long userId) {
        return onlinePlayerManager.getLobby().get(userId);
    }

    private UserDto isAuthorization(Long userId) {
        LobbyUserDto lobbyUserDto = findUser(userId);
        return lobbyUserDto == null ? null : lobbyUserDto.getUser();
    }

    private RoomStateDto findRoom(WebSocketSession targetSession) {
        for(String roomId : onlinePlayerManager.getRooms().keySet()) {
            RoomStateDto room = onlinePlayerManager.getRooms().get(roomId);
            if(room.getSessions().contains(targetSession)) return room;
        }
        return null;
    }

    private JoinDto mapJoinRequest(RoomStateDto room, UserDto user) {
        return JoinDto.builder()
                .roomId(room.getRoomId())
                .gameType(room.getGameType())
                .user(user)
                .roomPw(room.getRoomPw())
                .build();
    }
}
