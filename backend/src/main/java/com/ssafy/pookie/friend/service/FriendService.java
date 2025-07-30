package com.ssafy.pookie.friend.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.friend.dto.FriendDto;
import com.ssafy.pookie.friend.dto.FriendResponseDto;
import com.ssafy.pookie.friend.model.FriendRequests;
import com.ssafy.pookie.friend.model.Friends;
import com.ssafy.pookie.friend.model.RequestStatus;
import com.ssafy.pookie.friend.model.Status;
import com.ssafy.pookie.friend.repository.FriendRequestsRepository;
import com.ssafy.pookie.friend.repository.FriendsRepository;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FriendService {

    private final FriendRequestsRepository friendRequestsRepository;
    private final FriendsRepository friendsRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final OnlinePlayerManager onlinePlayerManager;
    private final NotificationService notificationService;

    public FriendResponseDto sendFriendRequest(Long id, Long addresseeId) throws Exception {
        UserAccounts userAccount = userAccountsRepository.findById(id)
                .orElseThrow(() -> new Exception("User not found"));
        UserAccounts friendAccount = userAccountsRepository.findById(addresseeId)
                .orElseThrow(() -> new Exception("User not found"));

        FriendRequests friendRequest = FriendRequests.builder()
                .user(userAccount)
                .friend(friendAccount)
                .status(RequestStatus.PENDING)
                .build();

        friendRequestsRepository.save(friendRequest);

        return FriendResponseDto.from(friendRequest);
    }

    public void acceptFriendRequest(Long requestId, Long userAccountId) throws IOException {
        FriendRequests friendRequest = friendRequestsRepository.findById(requestId)
                .orElseThrow();

        // 1. 요청 받는 사람이 맞는지 검증
        if (!friendRequest.getFriend().getId().equals(userAccountId)) {
            throw new RuntimeException("Unauthorized to accept this friend request");
        }

        // 2. 요청 상태가 acceptance가 true 인지
        if (!friendRequest.getStatus().equals(RequestStatus.PENDING)) {
            throw new RuntimeException("Friend request is not pending");
        }

        // 3. 친구 요청 상태를 ACCEPTED로 변경
        friendRequest.updateStatus(RequestStatus.ACCEPTED);
        friendRequestsRepository.save(friendRequest);

        // 4. 양방향 친구 관계 생성
        Friends friendship = Friends.builder()
                .user1(friendRequest.getUser())
                .user2(friendRequest.getFriend())
                .status(Status.ACTIVE)
                .build();

        friendsRepository.save(friendship);

        UserDto user = onlinePlayerManager.getMemberInLobby(userAccountId).getUser();
        notificationService.readEvent(user);
    }

    // 거절은 요청을 받은 사람이 거절
    // 따라서 friend가 거절
    public void rejectFriendRequest(Long requestId, Long userAccountId) {
        FriendRequests friendRequest = friendRequestsRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!friendRequest.getFriend().getId().equals(userAccountId)) {
            throw new RuntimeException("Unauthorized to reject this friend request");
        }

        if (!friendRequest.getStatus().equals(RequestStatus.PENDING)) {
            throw new RuntimeException("Friend request is not pending");
        }

        friendRequest.updateStatus(RequestStatus.REJECTED);
        friendRequestsRepository.save(friendRequest);
    }

    /**
     * 받은 친구 요청 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FriendResponseDto> getReceivedRequests(Long userAccountId) {
        // 해당 사용자가 받은 친구 요청들 조회 (PENDING 상태만)
        List<FriendRequests> receivedRequests = friendRequestsRepository
                .findByFriendIdAndStatus(userAccountId, RequestStatus.PENDING);

        return receivedRequests.stream()
                .map(FriendResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 보낸 친구 요청 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FriendResponseDto> getSentRequests(Long userAccountId) {
        // 해당 사용자가 보낸 친구 요청들 조회 (PENDING 상태만)
        List<FriendRequests> sentRequests = friendRequestsRepository
                .findByUserIdAndStatus(userAccountId, RequestStatus.PENDING);

        return sentRequests.stream()
                .map(FriendResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 친구 삭제
     * 논리적 삭제
     */
    public void deleteFriend(Long userId, Long friendId) {
        Friends friend = friendsRepository.findFriendship(userId, friendId)
                .orElseThrow(() -> new RuntimeException("Friendship not found"));

        friend.updateStatus(Status.DELETED);
        friendsRepository.save(friend);
    }

    /**
     * 친구 차단
     */
    public void blockFriend(Long userId, Long friendId) {
        Friends friend = friendsRepository.findFriendship(userId, friendId)
                .orElseThrow(() -> new RuntimeException("Friendship not found"));

        friend.updateStatus(Status.BLOCKED);
        friendsRepository.save(friend);
    }

    /**
     * 친구 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FriendDto> getFriends(Long userId) {
        friendsRepository.findFriendsByUserId(userId, Status.ACTIVE);
        return null;
    }

    /**
     * 친구 목록 조회 (검색 기능 포함)
     */
    @Transactional(readOnly = true)
    public Page<FriendDto> getFriends(Long userId, String search, Pageable pageable) {
        Page<Friends> friendsPage = friendsRepository.findFriendsByUserIdAndNickname(userId, search, pageable);
        return friendsPage.map(
                (friend) -> FriendDto.from(friend, Status.ACTIVE, userId)
        );
    }

    public boolean deleteFriendRequest(Long userAccountId, Long friendRequestId) {
        int deleteRows = friendRequestsRepository.deleteByLetterIdAndUserInvolved(friendRequestId, userAccountId);
        return deleteRows > 0;
    }
}
