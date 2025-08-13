package com.ssafy.pookie.game.room.service;

import com.ssafy.pookie.game.room.dto.FollowRequestDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {
    private OnlinePlayerManager onlinePlayerManager;

    public void handleFollow(FollowRequestDto request) {

    }

    private LobbyUserDto findUser(String userId) {
        return onlinePlayerManager.getLobby().get(userId);
    }
}
