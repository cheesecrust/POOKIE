package com.ssafy.pookie.game.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    /*
        게임에 접속한 유저의 정보
        - Socket Connect 시 Session Id
        - UserAccount 의 UserId
        - UserAccount 의 UserNickname
     */
    private String sid;
    private String userId;
    private String userNickname;
}
