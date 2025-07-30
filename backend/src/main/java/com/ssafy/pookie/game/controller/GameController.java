package com.ssafy.pookie.game.controller;

import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/game")
@RequiredArgsConstructor
public class GameController {

    private final OnlinePlayerManager onlinePlayerManager;

    @GetMapping("/init")
    public String init() {
        onlinePlayerManager.getRooms().clear();
        onlinePlayerManager.getLobby().clear();
        return "initialize";
    }
}
