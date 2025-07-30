package com.ssafy.pookie.letter.repository;

import com.ssafy.pookie.letter.dto.CombinedMessageProjection;
import com.ssafy.pookie.letter.model.Letters;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CombinedRepository extends JpaRepository<Letters, Long> {
    @Query(value = """
        (SELECT 
            l.id as requestId, 
            l.receiver_id as receiverId,
            u_receiver.nickname as receiverNickname,
            l.sender_id as senderId, 
            u_sender.nickname as senderNickname,
            l.message,
            l.status,
            'LETTER' as type,
            l.created_at as createdAt
        FROM letters l
        JOIN user_accounts u_receiver ON l.receiver_id = u_receiver.id
        JOIN user_accounts u_sender ON l.sender_id = u_sender.id
        WHERE l.receiver_id = :userId)
        
        UNION ALL
        
        (SELECT 
            fr.id as requestId,
            fr.friend_id as receiverId,
            u_receiver.nickname as receiverNickname,
            fr.user_id as senderId,
            u_sender.nickname as senderNickname,
            '친구 요청' as message,
            fr.status,
            'FRIEND_REQUEST' as type,
            fr.created_at as createdAt
        FROM friend_requests fr
        JOIN user_accounts u_receiver ON fr.friend_id = u_receiver.id
        JOIN user_accounts u_sender ON fr.user_id = u_sender.id
        WHERE fr.friend_id = :userId AND fr.status = 'PENDING')
        
        ORDER BY createdAt DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<CombinedMessageProjection> findCombinedMessages(
            @Param("userId") Long userId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(*) FROM (
            (SELECT l.id 
             FROM letters l 
             WHERE l.receiver_id = :userId)
            UNION ALL
            (SELECT fr.id 
             FROM friend_requests fr 
             WHERE fr.friend_id = :userId AND fr.status = 'PENDING')
        ) as combined_count
        """, nativeQuery = true)
    long countReceivedCombinedMessages(@Param("userId") Long userId);

    @Query(value = """
    (SELECT 
        l.id as requestId, 
        l.receiver_id as receiverId,
        u_receiver.nickname as receiverNickname,
        l.sender_id as senderId, 
        u_sender.nickname as senderNickname,
        l.message,
        l.status,
        'LETTER' as type,
        l.created_at as createdAt
    FROM letters l
    JOIN user_accounts u_receiver ON l.receiver_id = u_receiver.id
    JOIN user_accounts u_sender ON l.sender_id = u_sender.id
    WHERE l.sender_id = :userId)
    
    UNION ALL
    
    (SELECT 
        fr.id as requestId,
        fr.friend_id as receiverId,
        u_receiver.nickname as receiverNickname,
        fr.user_id as senderId,
        u_sender.nickname as senderNickname,
        '친구 요청' as message,
        fr.status,
        'FRIEND_REQUEST' as type,
        fr.created_at as createdAt
    FROM friend_requests fr
    JOIN user_accounts u_receiver ON fr.friend_id = u_receiver.id
    JOIN user_accounts u_sender ON fr.user_id = u_sender.id
    WHERE fr.user_id = :userId)
    
    ORDER BY createdAt DESC
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<CombinedMessageProjection> findSentMessages(
            @Param("userId") Long userId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(*) FROM (
            (SELECT l.id 
             FROM letters l 
             WHERE l.sender_id = :userId)
            UNION ALL
            (SELECT fr.id 
             FROM friend_requests fr 
             WHERE fr.user_id = :userId AND fr.status = 'PENDING')
        ) as combined_count
        """, nativeQuery = true)
    long countSentCombinedMessages(@Param("userId") Long userId);
}
