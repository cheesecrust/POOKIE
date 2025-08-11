package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.character.model.UserCharacters;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCharactersRepository extends JpaRepository<UserCharacters, Long> {
    List<UserCharacters> findByUserAccount_IdAndIsDrop(Long userAccountId, boolean isDrop);

    Optional<UserCharacters> findByUserAccount_IdAndCharacter_Id(Long userAccountId, Integer characterId);

    // 활성(미드랍) 중 최신 1개 선택 (createdAt 기준)
    Optional<UserCharacters> findTopByUserAccount_IdAndCharacter_IdAndIsDropFalseOrderByCreatedAtDesc(
            Long userAccountId, Integer characterId);

    boolean existsByUserAccount_Id(Long userAccountId);
}
