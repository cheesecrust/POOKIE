package com.ssafy.pookie.letter.repository;

import com.ssafy.pookie.letter.model.Letters;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface LettersRepository extends JpaRepository<Letters, Long> {

    Page<Letters> findLettersByReceiverId(Long userAccountId, Pageable pageable);

    Page<Letters> findLettersBySenderId(Long userAccountId, Pageable pageable);

    @Query("SELECT l FROM Letters l WHERE l.id = :letterId AND (l.sender.id = :accountId OR l.receiver.id = :accountId)")
    Optional<Letters> findByLetterIdAndUserInvolved(@Param("letterId") Long letterId, @Param("accountId") Long accountId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Letters l WHERE l.id = :letterId AND (l.sender.id = :accountId OR l.receiver.id = :accountId)")
    int deleteByLetterIdAndUserInvolved(@Param("letterId") Long letterId, @Param("accountId") Long accountId);
}
