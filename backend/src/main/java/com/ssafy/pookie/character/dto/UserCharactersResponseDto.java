package com.ssafy.pookie.character.dto;

import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.model.UserCharacters;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCharactersResponseDto {
    private int idx;
    private Long userAccountIdx;
    private String name;
    private int exp;
    private int step;
    private PookieType pookieType; // color

    public static UserCharactersResponseDto fromEntity(UserCharacters userCharacters) {
        return UserCharactersResponseDto.builder()
                .idx(userCharacters.getId())
                .userAccountIdx(userCharacters.getUserAccount().getId())
                .name(userCharacters.getCharacter().getName())
                .step(userCharacters.getCharacter().getStep())
                .exp(userCharacters.getExp())
                .pookieType(userCharacters.getCharacter().getType())
                .build();
    }
}
