package com.ssafy.pookie.friend.repository;

import com.ssafy.pookie.friend.model.Friends;
import com.ssafy.pookie.friend.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendsRepository extends JpaRepository<Friends, Long> {
    @Query("""
        SELECT f FROM Friends f 
        WHERE (f.user1.id = :userId OR f.user2.id = :userId) 
        AND f.status = :status
        """)
    List<Friends> findFriendsByUserId(@Param("userId") Long userId,
                                      @Param("status") Status status);

    @Query("""
        SELECT f FROM Friends f 
        WHERE ((f.user1.id = :userId1 AND f.user2.id = :userId2) 
            OR (f.user1.id = :userId2 AND f.user2.id = :userId1))
        """)
    Optional<Friends> findFriendship(@Param("userId1") Long userId1,
                                     @Param("userId2") Long userId2);

    @Query("""
        SELECT f FROM Friends f 
        JOIN FETCH f.user1 u1 
        JOIN FETCH f.user2 u2
        WHERE f.status = 'ACTIVE' 
        AND (
            (f.user1.id = :userId 
             AND LOWER(u2.nickname) LIKE LOWER(CONCAT('%', :nickname, '%'))) 
            OR 
            (f.user2.id = :userId 
             AND LOWER(u1.nickname) LIKE LOWER(CONCAT('%', :nickname, '%')))
        )
        ORDER BY f.createdAt DESC
        """)
    Page<Friends> findFriendsByUserIdAndNickname(
            @Param("userId") Long userId,
            @Param("nickname") String nickname,
            Pageable pageable);
}
