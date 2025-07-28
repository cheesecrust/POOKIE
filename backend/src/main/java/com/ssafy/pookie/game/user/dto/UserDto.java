package com.ssafy.pookie.game.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    // 유저의 권한 정보
    // [방장, 일반 사용자, 아무런 권한도 없음]
    public enum Grant {MASTER, PLAYER, NONE};
    public enum Status {READY, NONE}
    public enum Team {RED, BLUE, NONE}
    /*
        게임에 접속한 유저의 정보
        - Socket Connect 시 Session Id
        - UserAccount 의 UserId
        - UserAccount 의 UserNickname
        - READY
     */
    @JsonIgnore
    private WebSocketSession session;
    private Long userAccountId;
    private String userEmail;
    private String userNickname;
    private Grant grant = Grant.NONE;
    private Team team = Team.NONE;
    private Status status = Status.NONE;
    private String reqImg;

    public void setGrant(Grant grant) {
        this.grant = grant;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setTeam(Team team) { this.team = team; }
}
