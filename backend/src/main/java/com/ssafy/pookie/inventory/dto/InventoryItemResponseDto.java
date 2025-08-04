package com.ssafy.pookie.inventory.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemResponseDto {
    private Long idx;
    private String name;
    private String image;
    private int amount;
}