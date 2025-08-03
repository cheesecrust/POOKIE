package com.ssafy.pookie.store.dto;

import com.ssafy.pookie.store.model.StoreItem;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreItemResponseDto {
    private Long idx;
    private String name;
    private String image;
    private int price;
    private int exp;

    public static StoreItemResponseDto fromEntity(StoreItem item) {
        return StoreItemResponseDto.builder()
                .idx(item.getIdx())
                .name(item.getName())
                .image(item.getImage())
                .price(item.getPrice())
                .exp(item.getExp())
                .build();
    }
}
