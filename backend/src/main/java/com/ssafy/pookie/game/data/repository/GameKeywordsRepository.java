package com.ssafy.pookie.game.data.repository;

import com.ssafy.pookie.game.data.model.GameKeywords;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface GameKeywordsRepository extends JpaRepository<GameKeywords,Long> {

    // gameName으로 keywords 개수 조회
    @Query("SELECT COUNT(gk) FROM GameKeywords gk " +
            "JOIN gk.game gt WHERE gt.gameName = :gameName")
    Long countByGameName(@Param("gameName") String gameName);

    List<GameKeywords> findByIdIn(Collection<Long> ids);
}
