package com.ssafy.pookie.store.controller;

import com.ssafy.pookie.store.dto.PurchaseItemRequestDto;
import com.ssafy.pookie.store.dto.PurchaseItemResponseDto;
import com.ssafy.pookie.store.dto.StoreItemResponseDto;
import com.ssafy.pookie.store.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/store")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    // 상점 아이템 전체 조회
    @GetMapping("/items")
    public ResponseEntity<List<StoreItemResponseDto>> getAllItems() {
        return ResponseEntity.ok(storeService.getAllItems());
    }

    // 상점 아이템 단일 조회
    @GetMapping("/items/{itemId}")
    public ResponseEntity<StoreItemResponseDto> getItemById(@PathVariable Long itemId) {
        return ResponseEntity.ok(storeService.getItemById(itemId));
    }

    @PostMapping("/items/{itemId}")
    public ResponseEntity<PurchaseItemResponseDto> purchaseItem(@PathVariable Long itemId, @RequestBody PurchaseItemRequestDto requestDto) {
        return ResponseEntity.ok(storeService.purchaseItem(itemId, requestDto));
    }
}