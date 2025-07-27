package com.ssafy.pookie.friend.repository;

import com.ssafy.pookie.friend.model.FriendRequests;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendRequestsRepository extends JpaRepository<FriendRequests, Long> {
}
