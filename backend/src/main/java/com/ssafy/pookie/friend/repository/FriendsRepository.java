package com.ssafy.pookie.friend.repository;

import com.ssafy.pookie.friend.model.Friends;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendsRepository extends JpaRepository<Friends, Long> {
}
