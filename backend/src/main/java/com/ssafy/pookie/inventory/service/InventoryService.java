package com.ssafy.pookie.inventory.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.UserCharactersResponseDto;
import com.ssafy.pookie.character.model.UserCharacters;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.inventory.dto.InventoryItemResponseDto;
import com.ssafy.pookie.inventory.model.InventoryItem;
import com.ssafy.pookie.inventory.repository.InventoryItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryItemRepository inventoryItemRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final CharacterService characterService;

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

    // 인벤토리 아이템 사용
    @Transactional
    public UserCharactersResponseDto useInventoryItem(Long userAccountsId, Long inventoryItemIdx) {
        // 1. 아이템 찾기
        InventoryItem inventoryItem = inventoryItemRepository.findByUserAccountIdxAndIdx(userAccountsId, inventoryItemIdx)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품을 찾을 수 없습니다."));

        if (inventoryItem.getAmount() <= 0) {
            throw new RuntimeException("아이템 개수가 부족합니다.");
        }

        // 2. 캐릭터 경험치 증가 (레벨업 포함)
        UserCharacters updatedCharacter = characterService.feedMyPookie(userAccountsId, inventoryItem.getStoreItem().getExp());

        // 3. 아이템 개수 차감
        inventoryItem.decreaseAmount(1);
        if (inventoryItem.getAmount() == 0) {
            inventoryItemRepository.delete(inventoryItem);
        } else {
            inventoryItemRepository.save(inventoryItem);
        }

        // 레벨업이 되면 자동으로 대표 캐릭터로 변환
        characterService.changeRepPookie(updatedCharacter.getUserAccount(),
                                        updatedCharacter.getCharacter().getType(),
                                        updatedCharacter.getCharacter().getStep());

        // 4. 캐릭터 상태를 DTO로 변환 후 반환
        return UserCharactersResponseDto.fromEntity(updatedCharacter);
    }
}
