package com.ssafy.pookie.letter.dto;

import lombok.Data;

@Data
public class LetterRequestDto {
    private Long receiverId;
    private String message;
}
