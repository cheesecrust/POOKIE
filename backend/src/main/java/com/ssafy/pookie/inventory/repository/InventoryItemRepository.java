package com.ssafy.pookie.inventory.repository;

import com.ssafy.pookie.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByUserAccountIdxAndStoreItem_Idx(Long userAccountIdx, Long itemIdx);
    
    @Query("SELECT i FROM InventoryItem i JOIN FETCH i.storeItem WHERE i.userAccountIdx = :userAccountIdx")
    List<InventoryItem> findAllByUserAccountIdx(@Param("userAccountIdx") Long userAccountIdx);
    
    Optional<InventoryItem> findByUserAccountIdxAndIdx(Long userAccountIdx, Long inventoryIdx);

}
