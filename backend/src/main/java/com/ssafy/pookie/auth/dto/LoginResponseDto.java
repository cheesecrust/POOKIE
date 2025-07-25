package com.ssafy.pookie.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class LoginResponseDto {

    private Long userAccountId;
    private String email;
    private String nickname;
    private String accessToken;
    private String refreshToken;
}
