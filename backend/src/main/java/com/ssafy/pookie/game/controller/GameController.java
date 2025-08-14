package com.ssafy.pookie.game.controller;

import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.CloseStatus;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/game")
@RequiredArgsConstructor
public class GameController {

    private final OnlinePlayerManager onlinePlayerManager;

    @GetMapping("/init")
    public String init() {
        try {
            for (LobbyUserDto user : onlinePlayerManager.getLobby().values()) {
                user.getUser().getSession().close(CloseStatus.POLICY_VIOLATION);
            }
            onlinePlayerManager.getRooms().clear();
            onlinePlayerManager.getLobby().clear();
        } catch (Exception e) {
            log.error("INIT ERROR");
        } finally {
            return "initialize";
        }
    }
}
