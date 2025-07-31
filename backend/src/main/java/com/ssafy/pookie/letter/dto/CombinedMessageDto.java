package com.ssafy.pookie.letter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CombinedMessageDto {

    private Long requestId;
    private Long receiverId;
    private String receiverNickname;
    private Long senderId;
    private String senderNickname;
    private String message;
    private String status;
    private String type; // "LETTER" or "FRIEND_REQUEST"
    private LocalDateTime createdAt;

    // CombinedMessageProjection을 DTO로 변환하는 메서드
    public static CombinedMessageDto from(CombinedMessageProjection projection) {
        return CombinedMessageDto.builder()
                .receiverId(projection.getReceiverId())
                .receiverNickname(projection.getReceiverNickname())
                .senderId(projection.getSenderId())
                .senderNickname(projection.getSenderNickname())
                .message(projection.getMessage())
                .status(projection.getStatus())
                .type(projection.getType())
                .createdAt(projection.getCreatedAt())
                .requestId(projection.getRequestId())
                .build();
    }
}
