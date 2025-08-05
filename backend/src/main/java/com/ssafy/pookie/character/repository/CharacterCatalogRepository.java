package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;


@Repository
public interface CharacterCatalogRepository extends JpaRepository<CharacterCatalog, Integer> {

    List<CharacterCatalog> findByUserAccountId(Long userAccountId);

    List<CharacterCatalog> findByUserAccountIdAndIsRepresent(Long userAccountId, boolean isRepresent);

    boolean existsByUserAccountIdAndCharacterStepAndCharacterType(Long userAccountId, int step, PookieType type);

    Optional<CharacterCatalog> findByUserAccountIdAndCharacterStepAndCharacterType(Long userAccountId, int step, PookieType type);

    Optional<CharacterCatalog> findByUserAccountAndCharacter(UserAccounts user, Characters character);

    @Modifying
    @Query("UPDATE CharacterCatalog c SET c.isRepresent = false WHERE c.userAccount.id = :userId")
    void resetAllRepresent(Long userId);

    @Modifying
    @Query("UPDATE CharacterCatalog c SET c.isGrowing = false WHERE c.userAccount.id = :userId")
    void resetAllGrowing(Long userId);
}
