package com.ssafy.pookie.auth.dto;

import com.ssafy.pookie.character.model.Characters;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserResponseDto {
    private Long userAccountId;
    private String nickname;
    private String email;
    private int coin;
    private Characters repCharacter;
}
