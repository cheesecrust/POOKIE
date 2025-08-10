package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.PookieType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface CharacterCatalogRepository extends JpaRepository<CharacterCatalog, Integer> {

    List<CharacterCatalog> findByUserAccount_Id(Long userAccountId);

    List<CharacterCatalog> findByUserAccount_IdAndIsRepresent(Long userAccountId, boolean represent);
    List<CharacterCatalog> findByUserAccount_IdAndIsGrowing(Long userAccountId, boolean growing);

    Optional<CharacterCatalog> findByUserAccount_IdAndCharacter_StepAndCharacter_Type(Long userAccountId, int step, PookieType type);

    @Query("select cc from CharacterCatalog cc where cc.id = :id and cc.character.id = :characterId")
    Optional<CharacterCatalog> findOne(@Param("id") int id, @Param("characterId") int characterId);

    // --- Bulk Update 유틸 ---
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CharacterCatalog c set c.isRepresent = false where c.userAccount.id = :userId")
    int resetAllRepresent(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CharacterCatalog c set c.isGrowing = false where c.userAccount.id = :userId")
    int resetAllGrowing(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
           update CharacterCatalog c
              set c.isRepresent = :represent,
                  c.isGrowing   = :growing
            where c.userAccount.id = :userId
              and c.character.id   = :characterId
           """)
    int updateCatalogState(@Param("userId") Long userId,
                           @Param("characterId") int characterId,
                           @Param("represent") boolean represent,
                           @Param("growing") boolean growing);

    @Query("""
    SELECT cc FROM CharacterCatalog cc
    JOIN FETCH cc.character
    WHERE cc.userAccount.id IN :userIds 
    AND cc.isRepresent = true
    """)
    List<CharacterCatalog> findRepresentativeCharactersByUserIds(@Param("userIds") List<Long> userIds);
}
