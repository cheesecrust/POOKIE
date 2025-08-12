package com.ssafy.pookie.game.server.scheduler;

import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServerScheduler {
    private final OnlinePlayerManager onlinePlayerManager;

    // 30 분마다 실행
//    @Scheduled(fixedDelay = 1000*60*30)
    @Scheduled(fixedDelay = 1000*30)
    public void checkInvalidInformation() {
        log.info("Server Checking [{}]", LocalDateTime.now());
        Integer originRoomCnt = onlinePlayerManager.getRooms().size();
        if(onlinePlayerManager.getLobby().isEmpty()) {
            onlinePlayerManager.getRooms().clear();
            onlinePlayerManager.getMiniGameRooms().clear();     // 미니 게임 room 은 서비스상 크리티컬하지 않음
        } else {
            onlinePlayerManager.getRooms().keySet().forEach((roomId) -> {
                RoomStateDto room = onlinePlayerManager.getRooms().get(roomId);
                // 비정상적인 유저가 방에 존재하는 경우 해당 유저를 삭제
                room.getSessions().forEach((session) -> {
                    if(!session.isOpen()) {
                        room.getSessions().removeIf(s -> s==session);
                        room.getUsers().keySet().forEach((team) -> {
                            room.getUsers().get(team).removeIf(user->user.getSession()==session);
                        });
                    }
                });

                // 사용자가 존재하지 않거나, 비정상적인 방인 경우
                if(room.getSessions().isEmpty() ||
                        (room.getUsers().get("RED").size() + room.getUsers().get("BLUE").size()) == 0) {
                    onlinePlayerManager.getRooms().remove(roomId);
                    onlinePlayerManager.getLobby().keySet().forEach((userAccountId) -> {
                        LobbyUserDto lobbyUser = onlinePlayerManager.getLobby().get(userAccountId);
                        if(lobbyUser.getStatus() == LobbyUserDto.Status.ON) {
                            try {
                                onlinePlayerManager.sendToMessageUser(lobbyUser.getUser().getSession(), Map.of(
                                        "type", MessageDto.Type.ROOM_REMOVED,
                                        "room", Map.of("roomId", roomId)
                                ));
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        }
                    });
                }
            });
        }

        if(originRoomCnt - onlinePlayerManager.getRooms().size() > 0) {
            log.info("Invalid Room {} was Removed", originRoomCnt - onlinePlayerManager.getRooms().size());
        }
    }
}
