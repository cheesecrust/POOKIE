package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.friend.model.FriendRequests;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FriendRequestDto {
    private static String requestMessage = "친구 요청이 왔습니다!";

    private Long addresseeId;
    private String addresseeNickname;
    private String message;
    private LocalDateTime createdAt;

    public static FriendRequestDto from(FriendRequests request) {
        return FriendRequestDto.builder()
                .addresseeId(request.getFriend().getId())
                .addresseeNickname(request.getFriend().getNickname())
                .message(requestMessage)
                .build();
    }
}