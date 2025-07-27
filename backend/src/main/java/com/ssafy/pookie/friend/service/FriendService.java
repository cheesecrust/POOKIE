package com.ssafy.pookie.friend.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.friend.dto.FriendDto;
import com.ssafy.pookie.friend.dto.FriendResponseDto;
import com.ssafy.pookie.friend.model.FriendRequests;
import com.ssafy.pookie.friend.repository.FriendRequestsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestsRepository friendRequestsRepository;
    private final UserAccountsRepository userAccountsRepository;

    public FriendResponseDto sendFriendRequest(Long id, Long addresseeId) throws Exception {
        UserAccounts userAccount = userAccountsRepository.findById(id)
                .orElseThrow(() -> new Exception("User not found"));
        UserAccounts friendAccount = userAccountsRepository.findById(addresseeId)
                .orElseThrow(() -> new Exception("User not found"));

        FriendRequests friendRequest = FriendRequests.builder()
                .user(userAccount)
                .friend(friendAccount)
                .acceptance(false)
                .build();

        friendRequestsRepository.save(friendRequest);

        return FriendResponseDto.from(friendRequest);
    }

    public void acceptFriendRequest(Long requestId, Long id) {
    }

    public void rejectFriendRequest(Long requestId, Long id) {
    }

    public List<FriendResponseDto> getReceivedRequests(Long id) {
        return null;
    }

    public List<FriendResponseDto> getSentRequests(Long id) {
        return null;
    }

    public void deleteFriend(Long id, Long friendId) {
    }

    public void blockFriend(Long id, Long friendId) {
    }

    public List<FriendDto> getFriends(Long id, String search) {
        return null;
    }
}
