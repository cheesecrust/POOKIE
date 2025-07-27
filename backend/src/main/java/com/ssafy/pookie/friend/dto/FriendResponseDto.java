package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.friend.model.FriendRequests;
import lombok.Builder;

@Builder
public class FriendResponseDto {

    private Long userId;
    private String userNickname;
    private Long addresseeId;
    private String addresseeNickname;

    public static FriendResponseDto from(FriendRequests friendRequest) {
        return FriendResponseDto.builder()
                .userId(friendRequest.getUser().getId())
                .userNickname(friendRequest.getUser().getNickname())
                .addresseeId(friendRequest.getFriend().getId())
                .addresseeNickname(friendRequest.getFriend().getNickname())
                .build();
    }
}
