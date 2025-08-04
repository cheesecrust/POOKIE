package com.ssafy.pookie.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseItemResponseDto {
    private Long userAccountIdx;  // 구매자 ID
    private Long itemIdx;         // 구매한 아이템 ID
    private String itemName;       // 구매한 아이템 이름
    private int itemCount;        // 구매한 아이템 포함해서 현재 인벤토리에 있는 개수
}
