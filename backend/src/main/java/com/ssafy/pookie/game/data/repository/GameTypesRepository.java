package com.ssafy.pookie.game.data.repository;

import com.ssafy.pookie.game.data.model.GameTypes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameTypesRepository extends JpaRepository<GameTypes,Long> {

}
