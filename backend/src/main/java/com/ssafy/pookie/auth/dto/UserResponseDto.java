package com.ssafy.pookie.auth.dto;

import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserResponseDto {
    private Long userAccountId;
    private String nickname;
    private String email;
    private int coin;
    private RepCharacterResponseDto repCharacter;
}
