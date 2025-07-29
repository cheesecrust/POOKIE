package com.ssafy.pookie.friend.repository;

import com.ssafy.pookie.friend.model.FriendRequests;
import com.ssafy.pookie.friend.model.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendRequestsRepository extends JpaRepository<FriendRequests, Long> {
    List<FriendRequests> findByFriendIdAndStatus(Long friendId, RequestStatus status);

    List<FriendRequests> findByUserIdAndStatus(Long userId, RequestStatus status);

    Page<FriendRequests> findByUserIdAndStatus(Long userId, RequestStatus status, Pageable pageable);

    Page<FriendRequests> findByFriendIdAndStatus(Long friendId, RequestStatus status, Pageable pageable);

    List<FriendRequests> findByUserIdAndFriendId(Long userId, Long friendId);
}
