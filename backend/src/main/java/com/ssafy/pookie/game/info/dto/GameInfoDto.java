package com.ssafy.pookie.game.info.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
public class GameInfoDto {
    // 고요속의 외침, 일심동체 -> 1명, 이어그리기 n-1 명
    // rep : 게임에서 뭔가 행동을 하는 사람
    private List<UserDto> rep;
    private Long repIdx;
    private List<UserDto> normal;
    private Set<Long> keywordSet;
    private List<String> keywordList;
    private Integer keywordIdx;

    public void setStartGame() {
        this.rep = new ArrayList<>();
        this.normal = new ArrayList<>();
        this.keywordSet = new HashSet<>();
        this.keywordList = new ArrayList<>();
        this.repIdx = 0L;
        this.keywordIdx = 0;
    }

    public void setInit() {
        this.rep.clear();
        this.normal.clear();
        this.keywordList.clear();
        this.keywordIdx = 0;
        this.repIdx = 0L;
    }

    public void resetAfterGameOver() {
        this.rep.clear();
        this.normal.clear();
        this.keywordSet.clear();
        this.keywordList.clear();
        this.keywordIdx = 0;
        this.repIdx = 0L;
    }

    // 정답을 맞춘다면, keywordIdx, repIdx 를 증가시킨다.
    public void afterAnswerCorrect() {
        this.keywordIdx++;
        this.repIdx++;
    }
}
