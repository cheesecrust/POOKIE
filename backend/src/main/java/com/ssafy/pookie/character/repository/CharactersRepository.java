package com.ssafy.pookie.character.repository;

import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharactersRepository extends JpaRepository<Characters, Integer> {
    List<Characters> findCharactersByType(PookieType type);

    List<Characters> findCharactersByTypeAndStep(PookieType type, int step);
}
