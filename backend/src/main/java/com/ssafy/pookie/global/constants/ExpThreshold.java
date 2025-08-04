package com.ssafy.pookie.global.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;

@Getter
@AllArgsConstructor
public enum ExpThreshold {
    STEP1_TO_2(1, 100),
    STEP2_TO_3(2, 200);

    private final int step;
    private final int requiredExp;

    public static int getRequiredExpForStep(int step) {
        return Arrays.stream(values())
                .filter(e -> e.getStep() == step)
                .map(ExpThreshold::getRequiredExp)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid step: " + step));
    }
}
