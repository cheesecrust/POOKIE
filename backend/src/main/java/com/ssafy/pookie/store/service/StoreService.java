package com.ssafy.pookie.store.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.global.exception.CustomException;
import com.ssafy.pookie.global.exception.constants.ErrorCode;
import com.ssafy.pookie.inventory.model.InventoryItem;
import com.ssafy.pookie.inventory.repository.InventoryItemRepository;
import com.ssafy.pookie.store.dto.PurchaseItemResponseDto;
import com.ssafy.pookie.store.dto.StoreItemResponseDto;
import com.ssafy.pookie.store.model.StoreItem;
import com.ssafy.pookie.store.repository.StoreItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreItemRepository storeItemRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final InventoryItemRepository inventoryItemRepository;

    // 전체 조회
    public List<StoreItemResponseDto> getAllItems() {
        return storeItemRepository.findAll().stream()
                .map(StoreItemResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 단일 조회
    public StoreItemResponseDto getItemById(Long itemId) {
        StoreItem item = storeItemRepository.findById(itemId)
                .orElseThrow(() -> new CustomException(ErrorCode.ITEM_NOT_FOUND));
        return StoreItemResponseDto.fromEntity(item);
    }

    // 상품 구매
    @Transactional
    public PurchaseItemResponseDto purchaseItem(Long userAccountId, Long itemIdx) {
        StoreItem item = storeItemRepository.findById(itemIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.ITEM_NOT_FOUND));

        UserAccounts userAccounts = userAccountsRepository.findById(userAccountId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (userAccounts.getCoin() < item.getPrice()) {
            throw new CustomException(ErrorCode.INSUFFICIENT_COIN);
        }

        Boolean canBought = userAccounts.buyItem(item.getPrice());
        if (!canBought) {
            throw new CustomException(ErrorCode.INSUFFICIENT_COIN);
        }

        userAccountsRepository.save(userAccounts);

        // 인벤토리에 추가
        InventoryItem inventoryItem = inventoryItemRepository
                .findByUserAccountIdxAndStoreItem_Idx(userAccountId, item.getIdx())
                .orElse(InventoryItem.builder()
                        .userAccountIdx(userAccountId)
                        .storeItem(item)
                        .amount(0)
                        .build());

        inventoryItem.setAmount(inventoryItem.getAmount() + 1);
        InventoryItem savedInventoryItem = inventoryItemRepository.save(inventoryItem);

        return PurchaseItemResponseDto.builder()
                .userAccountIdx(savedInventoryItem.getUserAccountIdx())
                .itemCount(savedInventoryItem.getAmount())
                .itemIdx(item.getIdx())
                .itemName(item.getName())
                .build();
    }
}