package com.ssafy.pookie.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SignupResponseDto {

    private Long userId;
    private String email;
    private String nickname;
    private LocalDateTime createdAt;
}
