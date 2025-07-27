package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.friend.model.Status;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendDto {
    private Long userId;
    private String nickname;
    private Status status;

    public static FriendDto from(UserAccounts user, Status status) {
        return FriendDto.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .status(status)
                .build();
    }
}
