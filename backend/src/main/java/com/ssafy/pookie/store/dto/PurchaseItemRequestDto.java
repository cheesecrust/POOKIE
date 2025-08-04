package com.ssafy.pookie.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseItemRequestDto {
    private Long itemIdx;         // 구매할 아이템 ID
}
