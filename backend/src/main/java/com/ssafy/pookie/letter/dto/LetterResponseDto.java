package com.ssafy.pookie.letter.dto;

import com.ssafy.pookie.letter.model.LetterStatus;
import com.ssafy.pookie.letter.model.Letters;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class LetterResponseDto {

    private Long id;
    private Long receiverId;
    private String receiverNickname;
    private Long senderId;
    private String senderNickname;
    private String message;
    private LetterStatus status;

    public static LetterResponseDto of(Letters letter) {
        return LetterResponseDto.builder()
                .id(letter.getId())
                .receiverId(letter.getReceiver().getId())
                .receiverNickname(letter.getReceiver().getNickname())
                .senderId(letter.getSender().getId())
                .senderNickname(letter.getSender().getNickname())
                .message(letter.getMessage())
                .status(letter.getStatus())
                .build();
    }
}
