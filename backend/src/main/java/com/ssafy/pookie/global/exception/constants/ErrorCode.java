package com.ssafy.pookie.global.exception.constants;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // User 관련
    INVALID_LOGIN(HttpStatus.BAD_REQUEST, "이메일 또는 비밀번호가 올바르지 않습니다."),

    // Store 관련
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 상품을 찾을 수 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 계정을 찾을 수 없습니다."),
    INSUFFICIENT_COIN(HttpStatus.BAD_REQUEST, "코인이 부족하여 구매할 수 없습니다."),

    // Inventory 관련
    INVENTORY_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 인벤토리 아이템을 찾을 수 없습니다."),
    INSUFFICIENT_ITEM_AMOUNT(HttpStatus.BAD_REQUEST, "아이템 개수가 부족합니다."),

    // Character 관련
    TOO_MANY_POOKIES(HttpStatus.BAD_REQUEST, "보유 가능한 푸키 수를 초과했습니다."),
    REP_POKIE_NOT_FOUND(HttpStatus.NOT_FOUND, "대표 캐릭터를 찾을 수 없습니다."),
    GROWING_POKIE_NOT_FOUND(HttpStatus.NOT_FOUND, "성장하는 캐릭터를 찾을 수 없습니다."),
    CHARACTER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 푸키를 찾을 수 없습니다."),
    POOKIE_ALREADY_GROWING(HttpStatus.BAD_REQUEST, "성장 중인 푸키가 있으므로 새로운 푸키 발급이 불가합니다."),

    INVALID_USER_ACCOUNT(HttpStatus.BAD_REQUEST, "UserAccount가 아직 DB에 저장되지 않았습니다."),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "내부 서버 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
