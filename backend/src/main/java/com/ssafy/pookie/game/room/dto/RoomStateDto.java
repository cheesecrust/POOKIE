package com.ssafy.pookie.game.room.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.game.info.dto.GameInfoDto;
import com.ssafy.pookie.game.message.dto.MessageDto;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.timer.dto.GameTimerDto;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import jakarta.annotation.Nullable;
import lombok.*;
import org.springframework.web.socket.WebSocketSession;

import java.util.*;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomStateDto {
    public enum Status {WAITING, START, END};
    public enum Turn {RED, BLUE, NONE};
    public enum GameType {SAMEPOSE, SILENTSCREAM, SKETCHRELAY};

    // 타이머
    private GameTimerDto timer;

    private String roomId;
    private String roomTitle;
    private GameType gameType;
    private String roomPw;
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
                        "roomTitle", roomTitle,
                        "gameType", gameType.toString(),
                        "round", round,
                        "turn", turn.toString(),
                        "status", status.toString(),
                        "roomMaster", roomMaster,
                        "redTeam", users.getOrDefault("RED", new ArrayList<>()).size(),
                        "blueTeam", users.getOrDefault("BLUE", new ArrayList<>()).size(),
                        "redScore", teamScores.get("RED"),
                        "blueScore", teamScores.get("BLUE")
                ));
    }
    // 같은 인원과 게임이 끝나면 다시 WAITING 상태로 변환
    public void resetRoom() {
        this.status = Status.WAITING;
        this.turn = Turn.NONE;
        this.teamScores.computeIfPresent("RED", (k,v) -> 0);
        this.teamScores.computeIfPresent("BLUE", (k,v)-> 0);
        this.round = 0;
    }

    // 현재 각 팀의 인원 수 상태 파악
    public Map<String, Integer> getTeamInfo() {
        return Map.of(
          "RED", users.getOrDefault("RED", new ArrayList<>()).size(),
          "BLUE", users.getOrDefault("BLUE", new ArrayList<>()).size(),
                "TOTAL", users.getOrDefault("RED", new ArrayList<>()).size()+users.getOrDefault("BLUE", new ArrayList<>()).size()
        );
    }
    // 팀원을 균등하게 배분
    public UserDto.Team assignTeamForNewUser() {
        Map<String, Integer> teamInfo = getTeamInfo();
        int redTeam = teamInfo.get("RED");
        int blueTeam = teamInfo.get("BLUE");
        // 1. RED 팀 우선 배정
        // RED 팀에 아무도 없다면 RED 로 배정
        if(redTeam == 0) return UserDto.Team.RED;

        // 2. 팀원 수에 따라 배정
        // 팀원 수가 같다면 RED 가 우선권
        if(redTeam <= blueTeam) return UserDto.Team.RED;
        else return UserDto.Team.BLUE;
    }

    public void resetTempTeamScore() {
        this.tempTeamScores.put("RED", 0);
        this.tempTeamScores.put("BLUE", 0);
    }

    public void resetAfterGameOver() {
        this.round = 0;
        this.turn = Turn.NONE;
        this.status = Status.WAITING;
        this.gameInfo.resetAfterGameOver();
        this.teamScores.computeIfPresent("RED", (k,v) -> 0);
        this.teamScores.computeIfPresent("BLUE", (k,v)-> 0);
        resetTempTeamScore();
    }

    public Boolean isIncluded(WebSocketSession session) {
        return this.sessions.contains(session);
    }

    public void writeTempTeamScore(TurnDto gameResult) {
        this.getTempTeamScores().put(this.getTurn().toString(), gameResult.getScore());
    }

    public void turnChange() {
        if(this.getTurn() == Turn.RED) this.setTurn(Turn.BLUE);
        else this.setTurn(Turn.RED);

        if(timer != null) this.timer.stop();
    }

    private String win;
    private Integer redTeamScore;
    private Integer blueTeamScore;
    public void roundOver() {
        redTeamScore = this.tempTeamScores.get(Turn.RED.toString());
        blueTeamScore = this.tempTeamScores.get(Turn.BLUE.toString());
        // 승 패
        if(redTeamScore > blueTeamScore) {
            this.teamScores.merge(Turn.RED.toString(), 1, Integer::sum);
            win = "RED";
        }
        else if(redTeamScore < blueTeamScore) {
            this.teamScores.merge(Turn.BLUE.toString(), 1, Integer::sum);
            win = "BLUE";
        }
        else {
            this.teamScores.merge(Turn.RED.toString(), 1, Integer::sum);
            this.teamScores.merge(Turn.BLUE.toString(), 1, Integer::sum);
            win = "DRAW";
        }
        if(timer != null) this.timer.stop();
    }

    public Map<String, Object> gameOver() {
        redTeamScore = this.teamScores.get("RED");
        blueTeamScore= this.teamScores.get("BLUE");
        Map<String, Object> result = Map.of(
                "win", redTeamScore > blueTeamScore ? "RED" : redTeamScore == blueTeamScore ? "DRAW" : "BLUE",
                "finalScore", Map.of(
                        "RED", redTeamScore,
                        "BLUE", blueTeamScore
                )
        );

        resetRoundResult();

        return result;
    }

    public Map<String, Object> roundResult() {
        Map<String, Object> result = Map.of(
                "type", MessageDto.Type.GAME_ROUND_OVERED.toString(),
                "round", this.round,
                "win", this.win,
                "roundResult", Map.of(
                        "RED", this.redTeamScore,
                        "BLUE", this.blueTeamScore
                ),
                "gameResult", Map.of(
                        "RED", this.getTeamScores().get(Turn.RED.toString()),
                        "BLUE", this.getTeamScores().get(Turn.BLUE.toString())
                )
        );

        resetRoundResult();
        return result;
    }

    private void resetRoundResult() {
        this.win = null;
        this.redTeamScore = this.blueTeamScore = null;
    }

    // Room Info Mapping
    public Map<String, Object> mappingRoomInfo() {
        Map<String, Object> roomInfo = new LinkedHashMap<>();
        roomInfo.put("id", this.getRoomId());
        roomInfo.put("title", this.getRoomTitle());
        roomInfo.put("gameType", this.getGameType().toString());
        roomInfo.put("master", Map.of(
                "id", this.getRoomMaster().getUserAccountId(),
                "email", this.getRoomMaster().getUserEmail(),
                "nickname", this.getRoomMaster().getUserNickname(),
                "grant", this.getRoomMaster().getGrant().toString(),
                "repImg", this.getRoomMaster().getReqImg() == null ? "" : this.getRoomMaster().getReqImg()
        ));
        roomInfo.put("RED", this.getUsers().get("RED") == null ? List.of() :
                this.getUsers().get("RED").stream().map(user -> Map.of(
                        "id", user.getUserAccountId(),
                        "email", user.getUserEmail(),
                        "nickname", user.getUserNickname(),
                        "repImg", user.getReqImg() == null ? "" : user.getReqImg(),
                        "status", user.getStatus().toString()
                )).collect(Collectors.toList())
        );
        roomInfo.put("BLUE", this.getUsers().get("BLUE") == null ? List.of() :
                this.getUsers().get("BLUE").stream().map(user -> Map.of(
                        "id", user.getUserAccountId(),
                        "email", user.getUserEmail(),
                        "nickname", user.getUserNickname(),
                        "repImg", user.getReqImg() == null ? "" : user.getReqImg(),
                        "status", user.getStatus().toString()
                )).collect(Collectors.toList())
        );
        roomInfo.put("teamInfo", Map.of(
                "RED", this.getUsers().getOrDefault("RED", List.of()).size(),
                "BLUE", (this.getUsers().getOrDefault("BLUE", List.of()).size()),
                "TOTAL", this.getUsers().getOrDefault("RED", List.of()).size()+this.getUsers().getOrDefault("BLUE", List.of()).size()
        ));

        return roomInfo;
    }

    public void updateTempScore() {
        this.tempTeamScores.merge(this.getTurn().toString(),
                1, Integer::sum);
        this.getGameInfo().afterAnswerCorrect();
    }

    // TempScore 를 확인한다. -> 서버와 클라이언트 교차검증
    public boolean validationTempScore(TurnDto tempResult) {
        return this.getTempTeamScores().get(this.getTurn().toString())
                .equals(tempResult.getScore());
    }

    // 현재 방에 Session 을 제거한다. -> 팀에서도 제거해야함
    public void removeUser(WebSocketSession session) {
        this.sessions.remove(session);
        for (String team : this.getUsers().keySet()) {
            this.users.get(team).removeIf(user -> user.getSession() == session);
        }
    }

    public Map<String, Object> mappingSimpleRoomInfo(MessageDto.Type type) {
        return Map.of(
                "type", type.toString(),
                "room", Map.of(
                        "roomId", this.roomId,
                        "roomTitle", this.roomTitle,
                        "gameType", this.gameType,
                        "roomMaster", this.roomMaster.getUserNickname(),
                        "roomPw", this.roomPw != null && !this.roomPw.isEmpty(),
                        "teamInfo", Map.of(
                                "RED", this.users.getOrDefault("RED", List.of()).size(),
                                "BLUE", this.users.getOrDefault("BLUE", List.of()).size(),
                                "TOTAL", this.users.getOrDefault("RED", List.of()).size()+this.users.getOrDefault("BLUE", List.of()).size()
                        )
                ));
    }

    public void updateUserTeamInfo() {
        this.users.get("RED").forEach((user) -> user.setTeam(UserDto.Team.RED));
        this.users.get("BLUE").forEach((user) -> user.setTeam(UserDto.Team.BLUE));
    }

    public void resetUserTeamInfo() {
        this.users.get("RED").forEach((user) -> user.setTeam(UserDto.Team.NONE));
        this.users.get("BLUE").forEach((user) -> user.setTeam(UserDto.Team.NONE));
    }

    // 게임 도중 누군가 나가면 게임을 종료한다.
    private void forcedGameOver() {
        String win = this.teamScores.get("RED") > this.teamScores.get("BLUE") ? "RED" : this.teamScores.get("RED") == this.teamScores.get("BLUE") ? "DRAW" : "BLUE";

    }
}
