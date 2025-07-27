package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.friend.model.FriendRequests;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FriendRequestDto {

    private Long addresseeId;
    private String addresseeNickname;

    public static FriendRequestDto from(FriendRequests request) {
        return FriendRequestDto.builder()
                .addresseeId(request.getFriend().getId())
                .addresseeNickname(request.getFriend().getNickname())
                .build();
    }
}