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

    public GameInfoDto() {
        this.rep = new ArrayList<>();
        this.normal = new ArrayList<>();
    }

    public void setInit() {
        this.rep.clear();
        this.normal.clear();
    }

    public void resetAfterGameOver() {
        this.rep.clear();
        this.normal.clear();
        this.keywordSet.clear();
    }
}
