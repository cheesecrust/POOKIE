package com.ssafy.pookie.game.room.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

import java.util.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomStateDto {
    public enum Status {WAITING, START, END};
    public enum Turn {RED, BLUE, NONE};
    public enum GameType {SAMEPOSE, SILENTSCREAM, SKETCHRELAY};

    private String roomId;
    private GameType gameType;
    private String roomPw = "";
    //  라운드는 1~3 라운드
    //  -> 게임 시작 전에는 0 Default
    private int round = 0;
    // 턴, 시작은 Red
    private Turn turn = Turn.NONE;
    // 게임 진행 상태 -> 게임이 끝날 때 업데이트
    private Status status = Status.WAITING;
    // 방장
    private UserDto roomMaster;
    // 발화자 등 팀 대표
    private GameInfoDto gameInfo;
    // 현재 접속중인 User 목록 ( 팀 구분 )
    // <팀정보, User 목록>
    private Map<String, List<UserDto>> users = new HashMap<>();
    private Map<String, Integer> tempTeamScores = new HashMap<>();
    private Map<String, Integer> teamScores = new HashMap<>();
    @JsonIgnore
    private Set<WebSocketSession> sessions = new HashSet<>();

    // 현재 방 상태 전달
    public String toJson() throws JsonProcessingException {
        return new ObjectMapper().writeValueAsString(
                Map.of(
                        "roomId", roomId,
                        "gameType", gameType.toString(),
                        "round", round,
                        "turn", turn.toString(),
                        "status", status.toString(),
                        "roomMaster", roomMaster,
                        "redTeam", users.getOrDefault("Red", new ArrayList<>()).size(),
                        "blueTeam", users.getOrDefault("Blue", new ArrayList<>()).size(),
                        "redScore", teamScores.get("Red"),
                        "blueScore", teamScores.get("Blue")
                ));
    }
    // 같은 인원과 게임이 끝나면 다시 WAITING 상태로 변환
    public void resetRoom() {
        this.status = Status.WAITING;
        this.turn = Turn.NONE;
        this.teamScores.computeIfPresent("Red", (k,v) -> 0);
        this.teamScores.computeIfPresent("Blue", (k,v)-> 0);
        this.round = 0;
    }
    // 유저 입장
    public void addUserToTeam(String team, UserDto user) {
        this.users.computeIfAbsent(team, (key) -> new ArrayList<>()).add(user);
    }
    // 현재 각 팀의 인원 수 상태 파악
    public Map<String, Integer> getTeamInfo() {
        return Map.of(
          "Red", users.getOrDefault("Red", new ArrayList<>()).size(),
          "Blue", users.getOrDefault("Blue", new ArrayList<>()).size(),
                "total", users.getOrDefault("Red", new ArrayList<>()).size()+users.getOrDefault("Blue", new ArrayList<>()).size()
        );
    }
    // 팀원을 균등하게 배분
    public String assignTeamForNewUser() {
        Map<String, Integer> teamInfo = getTeamInfo();
        int redTeam = teamInfo.get("Red");
        int blueTeam = teamInfo.get("Blue");
        // 1. RED 팀 우선 배정
        // RED 팀에 아무도 없다면 RED 로 배정
        if(redTeam == 0) return "Red";

        // 2. 팀원 수에 따라 배정
        // 팀원 수가 같다면 RED 가 우선권
        if(redTeam <= blueTeam) return "Red";
        else return "Blue";
    }
}
