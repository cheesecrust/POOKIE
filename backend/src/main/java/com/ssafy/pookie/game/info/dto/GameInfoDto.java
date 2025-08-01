package com.ssafy.pookie.game.info.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
public class GameInfoDto {
    // 고요속의 외침, 일심동체 -> 1명, 이어그리기 n-1 명
    // rep : 게임에서 뭔가 행동을 하는 사람
    private List<UserDto> rep;
    private Integer repIdx;
    private List<UserDto> normal;
    private Set<Long> keywordSet;
    private List<String> keywordList;
    private Integer keywordIdx;

    public void setStartGame() {
        this.rep = new ArrayList<>();
        this.normal = new ArrayList<>();
        this.keywordSet = new HashSet<>();
        this.keywordList = new ArrayList<>();
        this.repIdx = 0;
        this.keywordIdx = 0;
    }

    public void setInit() {
        this.rep.clear();
        this.normal.clear();
        this.keywordList.clear();
        this.keywordIdx = 0;
        this.repIdx = 0;
    }

    public void resetAfterGameOver() {
        this.rep.clear();
        this.normal.clear();
        this.keywordSet.clear();
        this.keywordList.clear();
        this.keywordIdx = 0;
        this.repIdx = 0;
    }

    // 정답을 맞춘다면, keywordIdx, repIdx 를 증가시킨다.
    public void afterAnswerCorrect() {
        this.keywordIdx++;
    }

    // 주체자에 대한 정보를 리스트로 반환한다
    public List<?> repAccountIdxList() {
        return this.rep.stream().map((user) -> user.getUserAccountId())
                .collect(Collectors.toList());
    }

    // 일반 유저에 대한 정보를 리스트로 반환한다.
    public List<?> norAccountIdxList() {
        return this.normal.stream().map((user) -> user.getUserAccountId())
                .collect(Collectors.toList());
    }

    // 이어그리기에서, 그림 그리는 사람 변경
    public boolean changePainter() {
        Integer tempRepIdx = this.repIdx;
        if(++tempRepIdx < rep.size()) { // 다음 차례의 대표자가 있는 경우
            this.repIdx = tempRepIdx;
            return true;
        }

        return false;
    }

    public Map<String, Object> mapGameInfo(String typeMessage) {
        return Map.of(
                "type", typeMessage,
                "keywordList", keywordList,
                "keywordIdx", this.keywordIdx,
                "repIdxList", this.repAccountIdxList(),
                "repIdx", this.repIdx,
                "norIdxList", this.norAccountIdxList()
        );
    }
}
