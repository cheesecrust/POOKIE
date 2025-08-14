package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.InviteRequestDto;
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
public class InviteService {
    private final OnlinePlayerManager onlinePlayerManager;

    public void handleInvite(InviteRequestDto request) throws IOException {
        log.info("Invite Request", request.getUser().getUserNickname());
        try {
            RoomStateDto room = findRoom(request.getRoomId());
            if(!isAuthorization(room, request.getUser().getSession())) throw new IllegalArgumentException("잘못된 요청입니다.");
            if(!room.getStatus().equals(RoomStateDto.Status.WAITING)) throw new IllegalArgumentException("현재 초대가 불가합니다.");
            LobbyUserDto invitedUser = findUser(request.getInvitedUserId());
            if(invitedUser == null) throw new IllegalArgumentException("해당 유저가 접속중이 아닙니다.");
            onlinePlayerManager.sendToMessageUser(invitedUser.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.INVITED,
                    "inviteUser", request.getUser().getUserNickname(),
                    "invitedUser", invitedUser.getUser().getUserNickname(),
                    "roomId", room.getRoomId(),
                    "roomTitle", room.getRoomTitle(),
                    "roomGameType", room.getGameType().toString()
            ));
//            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
//                    "type", MessageDto.Type.INVITED,
//                    "msg", "초대를 보냈습니다."
//            ));
        } catch (IllegalArgumentException e) {
            log.error("Invite Request Error : {}", e.getMessage());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR,
                    "msg", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Invite Request Error : {}", e.getMessage());
            onlinePlayerManager.sendToMessageUser(request.getUser().getSession(), Map.of(
                    "type", MessageDto.Type.ERROR,
                    "msg", e.getMessage()
            ));
        }
    }

    private RoomStateDto findRoom(String roomId) {
        return onlinePlayerManager.getRooms().get(roomId);
    }

    public LobbyUserDto findUser(Long userId) {
        return onlinePlayerManager.getLobby().get(userId);
    }

    private Boolean isAuthorization(RoomStateDto room, WebSocketSession session) {
        return room!=null && room.getSessions().contains(session);
    }
}
