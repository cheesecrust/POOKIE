package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CharacterCatalogRepository extends JpaRepository<CharacterCatalog, Integer> {
    List<CharacterCatalog> findCharacterCatalogByUserAccountId(Long userAccountId);
    
    List<CharacterCatalog> findCharacterCatalogByUserAccountIdAndIsRepresent(Long userAccountId, boolean isRepresent);

    boolean existsByUserAccountIdAndCharacterStepAndCharacterType(Long userAccountId, int step, PookieType type);

    Optional<CharacterCatalog> findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(Long userAccountId, int characterStep, PookieType characterType);
}
