package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.friend.model.FriendRequests;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class FriendResponseDto {

    private Long requestId;
    private Long userId;
    private String userNickname;
    private Long addresseeId;
    private String addresseeNickname;

    public static FriendResponseDto from(FriendRequests friendRequest) {
        return FriendResponseDto.builder()
                .requestId(friendRequest.getId())
                .userId(friendRequest.getUser().getId())
                .userNickname(friendRequest.getUser().getNickname())
                .addresseeId(friendRequest.getFriend().getId())
                .addresseeNickname(friendRequest.getFriend().getNickname())
                .build();
    }
}
