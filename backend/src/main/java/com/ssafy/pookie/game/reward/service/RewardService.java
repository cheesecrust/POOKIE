package com.ssafy.pookie.game.reward.service;

import com.ssafy.pookie.auth.service.UserService;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RewardService {
    private final UserService userService;

    public void saveReward(RoomStateDto room, String win, Integer coin) {
        if(!win.equals("DRAW")) {
            room.getUsers().get(win).forEach((user) -> {
                userService.updateCoinById(user.getUserAccountId(), coin);
            });
            return;
        }

        room.getUsers().get("RED").forEach((user) -> {
            userService.updateCoinById(user.getUserAccountId(), coin);
        });
        room.getUsers().get("BLUE").forEach((user) -> {
            userService.updateCoinById(user.getUserAccountId(), coin);
        });
    }
    // 미니게임 성공 시 10 코인 지급
    public void miniGameReward(UserDto user) {
        userService.updateCoinById(user.getUserAccountId(), 10);
    }
}
