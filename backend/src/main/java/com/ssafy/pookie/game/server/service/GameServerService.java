package com.ssafy.pookie.game.server.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.room.service.GameRoomService;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.*;
import com.ssafy.pookie.notification.service.NotificationService;
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
public class GameServerService {

    private final OnlinePlayerManager onlinePlayerManager;
    private final UserAccountsRepository userAccountsRepository;
    // Lobby User Management
    private final NotificationService notificationService;

    /*
        유저가 게임 Lobby 로 접속 시
     */
    public void handleOn(WebSocketSession session, UserDto userDto) throws IOException {
        log.info("ON REQUEST : {}", userDto.getUserEmail());
        // 현재 사용자가 다른 방에 있다면, 기존 방에서 제거
        onlinePlayerManager.removeUserFromRoom(session);

        // 기존에 접속되어 있는 사용자인지 확인 ( 중복 접속 )
        // 접속해있지 않다면 null 반환
        LobbyUserDto isExist = onlinePlayerManager.getLobby().get(userDto.getUserAccountId());
        if(isExist != null) {   // 기존에 동일 ID 로 접속되어 있는 사용자가 있음
            // 대기실에서 나온 사용자인지 확인
            if(isExist.getStatus() != LobbyUserDto.Status.ON) {
                isExist.setStatus(LobbyUserDto.Status.ON);
            } else {
                onlinePlayerManager.removeFromLobby(isExist.getUser().getSession());
                log.warn("Duplicated user : {} - {}", isExist.getUser().getUserAccountId(), isExist.getUser().getUserEmail());
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
                        "repCharacter", userDto.getRepCharacter() == null ? "정보가 없습니다." : userDto.getRepCharacter()
                ),
                "globalStatus", lobbyUserDto.getStatus().toString(),
                "roomList", existingRoomList()
        ));
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

        notificationService.loginEvent(user);
        Long userId = (Long) session.getAttributes().get("userAccountId");
        UserAccounts userAccount = userAccountsRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user account not found"));

        userAccount.updateOnline(true);
        userAccountsRepository.save(userAccount);
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
}
