package com.ssafy.pookie.inventory.repository;

import com.ssafy.pookie.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByUserAccountIdxAndStoreItem_Idx(Long userAccountIdx, Long itemIdx);
}
