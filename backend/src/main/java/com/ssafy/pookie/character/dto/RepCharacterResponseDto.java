package com.ssafy.pookie.character.dto;

import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.UserCharacters;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepCharacterResponseDto {

    private Long userCharacterId;
    private String characterName;
    private int step;
    private int exp;


    public static RepCharacterResponseDto fromEntity(UserCharacters userCharacters) {
        Characters curCharacter = userCharacters.getCharacter();

        return RepCharacterResponseDto.builder()
                .userCharacterId(userCharacters.getId())
                .characterName(curCharacter.getName())
                .step(curCharacter.getStep())
                .exp(userCharacters.getExp())
                .build();
    }
}
