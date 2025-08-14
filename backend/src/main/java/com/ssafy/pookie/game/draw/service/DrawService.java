package com.ssafy.pookie.game.draw.service;

import com.ssafy.pookie.game.draw.dto.DrawEvent;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.message.manager.MessageSenderManager;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class DrawService {

    private final Map<String, List<DrawEvent>> canvasHistory = new ConcurrentHashMap<>();
    private final OnlinePlayerManager onlinePlayerManager;
    private final MessageSenderManager messageSenderManager;

    public void drawEvent(DrawEvent drawEvent) throws IOException {
        try {
            Long userAccountId = drawEvent.getUser().getUserAccountId();
            // 이벤트를 히스토리에 저장
            canvasHistory.computeIfAbsent(drawEvent.getRoomId(), k -> new ArrayList<>())
                    .add(drawEvent);

            UserDto userDto = onlinePlayerManager.getMemberInLobby(userAccountId).getUser();
            Map<String, Object> msg = convertDrawEventToMsg(drawEvent);
            messageSenderManager.sendMessageBroadCastOther(userDto.getSession(), drawEvent.getRoomId(), null, msg);
        } catch (Exception e) {
            log.error("DRAW ERROR : {}", e.getMessage());
            throw e;
        }
    }

    private Map<String, Object> convertDrawEventToMsg(DrawEvent drawEvent) {
        return Map.of(
                "type", MessageDto.Type.GAME_DRAW_EVENT.toString(),
                "roomId", drawEvent.getRoomId(),
                "userAccountId", drawEvent.getUser().getUserAccountId(),
                "drawType", drawEvent.getDrawType(),
                "data", drawEvent.getData(),
                "timeStamp", drawEvent.getTimestamp());
    }
}
