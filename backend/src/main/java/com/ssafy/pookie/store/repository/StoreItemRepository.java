package com.ssafy.pookie.store.repository;

import com.ssafy.pookie.store.model.StoreItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreItemRepository extends JpaRepository<StoreItem, Long> {
}
