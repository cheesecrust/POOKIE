package com.ssafy.pookie.inventory.controller;

import com.ssafy.pookie.global.security.user.CustomUserDetails;
import com.ssafy.pookie.inventory.dto.InventoryItemResponseDto;
import com.ssafy.pookie.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/inventories")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    // 인벤토리 아이템 전체 조회
    @GetMapping()
    public ResponseEntity<List<InventoryItemResponseDto>> getAllInventoryItems(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getAllInventoryItems(userDetails.getUserAccountId()));
    }

    // 인벤토리 아이템 단일 조회
    @GetMapping("/{inventoryItemIdx}")
    public ResponseEntity<InventoryItemResponseDto> getInventoryItemById(@PathVariable Long inventoryItemIdx,
                                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(inventoryService.getInventoryItemById(userDetails.getUserAccountId(), inventoryItemIdx));
    }
}
