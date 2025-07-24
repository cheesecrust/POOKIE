package com.ssafy.pookie.auth.repository;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.model.base.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountsRepository extends JpaRepository<UserAccounts, Integer> {
    Optional<UserAccounts> findById(Long id);

    boolean existsByNickname(String nickname);

    UserAccounts findByUser(Users user);
}
