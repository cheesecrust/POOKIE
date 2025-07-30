package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.game.room.dto.RoomGameTypeChangeRequestDto;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameRoomService {
    private final OnlinePlayerManager onlinePlayerManager;

    // TODO GameServerService 에서 분리해오기

    // GAME TYPE CHANGE
    public void handleGameTypeChange(RoomGameTypeChangeRequestDto gameTypeChangeRequest) throws IOException {
        RoomStateDto room = onlinePlayerManager.getRooms().get(gameTypeChangeRequest.getRoomId());
        if(!onlinePlayerManager.isAuthorized(gameTypeChangeRequest.getRoomMaster().getSession(), room) ||
        !onlinePlayerManager.isMaster(gameTypeChangeRequest.getRoomMaster().getSession(), room)) {
            onlinePlayerManager.sendToMessageUser(gameTypeChangeRequest.getRoomMaster().getSession(), Map.of(
                    "type", "ERROR",
                    "msg", "잘못된 요청입니다."
            ));
            return;
        }
        room.setGameType(gameTypeChangeRequest.getRequestGameType());
        log.info("Room {} was changed {}", room.getRoomId(), room.getGameType().toString());
        onlinePlayerManager.broadCastMessageToRoomUser(gameTypeChangeRequest.getRoomMaster().getSession(), gameTypeChangeRequest.getRoomId(), null, Map.of(
                "type", "CHANGED_GAMETYPE",
                "msg", "게임이 변경되었습니다.",
                "room", room.mappingRoomInfo()
        ));
    }
}
