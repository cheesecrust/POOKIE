package com.ssafy.pookie.game.reward.service;

import com.ssafy.pookie.auth.service.UserService;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RewardService {
    private final UserService userService;

    public void saveReward(RoomStateDto room, String win, Integer coin) {
        System.out.println("주어질 코인 : " + coin);
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
}
