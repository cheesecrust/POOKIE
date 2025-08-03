package com.ssafy.pookie.store.service;

import com.ssafy.pookie.store.dto.StoreItemResponseDto;
import com.ssafy.pookie.store.model.StoreItem;
import com.ssafy.pookie.store.repository.StoreItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreItemRepository storeItemRepository;

    // 전체 조회
    public List<StoreItemResponseDto> getAllItems() {
        return storeItemRepository.findAll().stream()
                .map(StoreItemResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 단일 조회
    public StoreItemResponseDto getItemById(Long itemId) {
        StoreItem item = storeItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품을 찾을 수 없습니다."));
        return StoreItemResponseDto.fromEntity(item);
    }
}

