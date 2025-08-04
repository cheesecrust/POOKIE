package com.ssafy.pookie.inventory.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.inventory.dto.InventoryItemResponseDto;
import com.ssafy.pookie.inventory.model.InventoryItem;
import com.ssafy.pookie.inventory.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryItemRepository inventoryItemRepository;
    private final UserAccountsRepository userAccountsRepository;

    // 인벤토리 전체 조회
    public List<InventoryItemResponseDto> getAllInventoryItems(Long userAccountsId) {
        UserAccounts userAccounts = userAccountsRepository.findById(userAccountsId)
                .orElseThrow(() -> new IllegalArgumentException("해당 계정은 찾을 수 없습니다."));

        return inventoryItemRepository.findAllByUserAccountIdx(userAccounts.getId()).stream()
                .map(InventoryItemResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 인벤토리 단일 조회
    public InventoryItemResponseDto getInventoryItemById(Long userAccountsId, Long inventoryItemIdx) {
        UserAccounts userAccounts = userAccountsRepository.findById(userAccountsId)
                .orElseThrow(() -> new IllegalArgumentException("해당 계정은 찾을 수 없습니다."));


        InventoryItem inventoryItem = inventoryItemRepository.findByUserAccountIdxAndIdx(userAccounts.getId(), inventoryItemIdx)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품을 찾을 수 없습니다."));
        return InventoryItemResponseDto.fromEntity(inventoryItem);
    }
}
