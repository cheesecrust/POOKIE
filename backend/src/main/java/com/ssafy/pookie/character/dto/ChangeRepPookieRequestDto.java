package com.ssafy.pookie.character.dto;

import com.ssafy.pookie.character.model.PookieType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRepPookieRequestDto {
    
    private PookieType pookieType;
    private int step;
}