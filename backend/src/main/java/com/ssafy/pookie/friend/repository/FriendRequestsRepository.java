package com.ssafy.pookie.friend.repository;

import com.ssafy.pookie.friend.model.FriendRequests;
import com.ssafy.pookie.friend.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendRequestsRepository extends JpaRepository<FriendRequests, Long> {
    List<FriendRequests> findByFriendUserIdAndStatus(Long friendUserId, RequestStatus status);

    List<FriendRequests> findByUserUserIdAndStatus(Long userUserId, RequestStatus status);
}
