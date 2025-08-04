package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.character.model.UserCharacters;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCharactersRepository extends JpaRepository<UserCharacters, Integer> {
    List<UserCharacters> findUserCharactersByUserAccountIdAndIsDrop(Long userAccountId, boolean drop);
    Optional<UserCharacters> findByUserAccountIdAndCharacterId(Long userAccountId, Integer characterId);
}
