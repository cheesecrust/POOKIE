package com.ssafy.pookie.character.dto;

import com.ssafy.pookie.character.model.CharacterCatalog;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CharacterCatalogResponseDto {
    private Integer id;
    private Long userAccountId;
    private Integer characterId;
    private String characterName;
    private boolean represent;
    private boolean growing;

    public static List<CharacterCatalogResponseDto> fromEntity(List<CharacterCatalog> entities) {
        if (entities == null || entities.isEmpty()) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(CharacterCatalogResponseDto::fromEntity)
                .toList();
    }

    public static CharacterCatalogResponseDto fromEntity(CharacterCatalog e) {
        return CharacterCatalogResponseDto.builder()
                .id(e.getId())
                .userAccountId(e.getUserAccount().getId())
                .characterId(e.getCharacter().getId())
                .characterName(e.getCharacter().getName())
                .represent(e.isRepresent())
                .growing(e.isGrowing())
                .build();
    }
}
