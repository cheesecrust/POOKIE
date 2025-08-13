package com.ssafy.pookie.friend.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.repository.CharacterCatalogRepository;
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
import com.ssafy.pookie.global.exception.CustomException;
import com.ssafy.pookie.global.exception.constants.ErrorCode;
import com.ssafy.pookie.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FriendService {

    private final FriendRequestsRepository friendRequestsRepository;
    private final FriendsRepository friendsRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final OnlinePlayerManager onlinePlayerManager;
    private final NotificationService notificationService;
    private final CharacterCatalogRepository characterCatalogRepository;

    public FriendResponseDto sendFriendRequest(Long id, Long addresseeId) throws Exception {
        UserAccounts userAccount = userAccountsRepository.findById(id)
                .orElseThrow(() -> new Exception("User not found"));
        UserAccounts friendAccount = userAccountsRepository.findById(addresseeId)
                .orElseThrow(() -> new Exception("User not found"));

        if (friendRequestsRepository.existsByUserAndFriendAndStatus(userAccount, friendAccount, RequestStatus.PENDING)) {
            throw new CustomException(ErrorCode.ALREADY_SENT);
        }

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
        List<Long> friendUserIds = friendsPage.stream()
                .flatMap(friend -> Stream.of(
                        friend.getUser1().getId().equals(userId) ? friend.getUser2().getId() : friend.getUser1().getId()
                ))
                .distinct()
                .toList();

        Map<Long, CharacterCatalog> representativeChars = characterCatalogRepository
                .findRepresentativeCharactersByUserIds(friendUserIds)
                .stream()
                .collect(Collectors.toMap(
                        cc -> cc.getUserAccount().getId(),
                        cc -> cc
                ));

        List<FriendDto> friendDtos = friendsPage.stream()
                .map(friend -> {
                    // 친구 사용자 정보 추출
                    UserAccounts friendUser = friend.getUser1().getId().equals(userId)
                            ? friend.getUser2()
                            : friend.getUser1();

                    // 대표 캐릭터 정보 변환
                    CharacterCatalog repCharCatalog = representativeChars.get(friendUser.getId());
                    RepCharacterResponseDto repCharacterDto = repCharCatalog != null
                            ? RepCharacterResponseDto.from(repCharCatalog)
                            : null;

                    // FriendDto 생성
                    return FriendDto.from(friend, friend.getStatus(), userId, repCharacterDto, friendUser.isOnline());
                })
                .toList();

        return new PageImpl<>(friendDtos, pageable, friendsPage.getTotalElements());
    }

    public boolean deleteFriendRequest(Long userAccountId, Long friendRequestId) {
        int deleteRows = friendRequestsRepository.deleteByLetterIdAndUserInvolved(friendRequestId, userAccountId);
        return deleteRows > 0;
    }
}
