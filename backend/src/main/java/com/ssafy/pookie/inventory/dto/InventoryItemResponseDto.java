package com.ssafy.pookie.inventory.dto;

import com.ssafy.pookie.inventory.model.InventoryItem;
import com.ssafy.pookie.store.model.StoreItem;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemResponseDto {
    private Long idx;
    private Long userAccountIdx;
    private Long itemIdx;
    private String itemName;
    private String image;
    private int amount;

    public static InventoryItemResponseDto fromEntity(InventoryItem inventoryItem) {
        StoreItem storeItem = inventoryItem.getStoreItem();

        return InventoryItemResponseDto.builder()
                .idx(inventoryItem.getIdx())
                .userAccountIdx(inventoryItem.getUserAccountIdx())
                .amount(inventoryItem.getAmount())
                .image(storeItem.getImage())
                .itemName(storeItem.getName())
                .build();
    }
}