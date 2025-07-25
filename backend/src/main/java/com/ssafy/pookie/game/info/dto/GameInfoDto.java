package com.ssafy.pookie.game.info.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
public class GameInfoDto {
    // 고요속의 외침, 일심동체 -> 1명, 이어그리기 n-1 명
    private List<UserDto> rep;
    private List<UserDto> normal;
    private Set<Long> keywordSet;

    public void setInit() {
        rep = new ArrayList<>();
        normal = new ArrayList<>();
    }
}
