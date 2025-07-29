package com.ssafy.pookie.friend.controller;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.service.UserService;
import com.ssafy.pookie.common.dto.PageResponseDto;
import com.ssafy.pookie.common.response.ApiResponse;
import com.ssafy.pookie.friend.dto.FriendDto;
import com.ssafy.pookie.friend.dto.FriendRequestDto;
import com.ssafy.pookie.friend.dto.FriendResponseDto;
import com.ssafy.pookie.friend.model.Status;
import com.ssafy.pookie.friend.service.FriendService;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
@Slf4j
public class FriendController {

    private final FriendService friendService;
    private final UserService userService;

    /**
     * 친구 요청 보내기
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<FriendResponseDto>> sendFriendRequest(
            @RequestBody @Valid FriendRequestDto requestDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("친구 요청 전송 - 요청자: {}, 수신자: {}",
                userDetails.getUserAccountId(), requestDto.getAddresseeId());

        try {
            Long currentUserId = userDetails.getUserAccountId();
            FriendResponseDto result = friendService.sendFriendRequest(
                    currentUserId,
                    requestDto.getAddresseeId()
            );

            return ResponseEntity.ok(ApiResponse.success("친구 요청을 전송했습니다.", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("친구 요청 전송 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 요청 전송에 실패했습니다."));
        }
    }

    /**
     * 친구 요청 수락
     */
    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            friendService.acceptFriendRequest(requestId, userAccountId);

            return ResponseEntity.ok(ApiResponse.success(null, "친구 요청을 수락했습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("친구 요청 수락 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 요청 수락에 실패했습니다."));
        }
    }

    /**
     * 친구 요청 거절
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            friendService.rejectFriendRequest(requestId, userAccountId);

            return ResponseEntity.ok(ApiResponse.success("친구 요청을 거절했습니다.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("친구 요청 거절 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 요청 거절에 실패했습니다."));
        }
    }

    /**
     * 받은 친구 요청 목록 조회
     */
    @GetMapping("/requests/received")
    public ResponseEntity<ApiResponse<List<FriendResponseDto>>> getReceivedRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            List<FriendResponseDto> requests = friendService.getReceivedRequests(
                    userAccountId);
            return ResponseEntity.ok(ApiResponse.success("받은 친구 요청 목록을 조회했습니다.", requests));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("올바르지 않은 상태값입니다."));
        } catch (Exception e) {
            log.error("받은 친구 요청 목록 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 요청 목록 조회에 실패했습니다."));
        }
    }

    /**
     * 보낸 친구 요청 목록 조회
     */
    @GetMapping("/requests/sent")
    public ResponseEntity<ApiResponse<List<FriendResponseDto>>> getSentRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long userAccountId = userDetails.getUserAccountId();
            List<FriendResponseDto> requests = friendService.getSentRequests(
                    userAccountId);

            return ResponseEntity.ok(ApiResponse.success("보낸 친구 요청 목록을 조회했습니다.", requests));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("올바르지 않은 상태값입니다."));
        } catch (Exception e) {
            log.error("보낸 친구 요청 목록 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 요청 목록 조회에 실패했습니다."));
        }
    }

    /**
     * 친구 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponseDto<FriendDto>>> getFriends(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            Page<FriendDto> friendsPage = friendService.getFriends(
                    userAccountId, search, pageable);
            PageResponseDto<FriendDto> response = PageResponseDto.of(friendsPage);
            return ResponseEntity.ok(ApiResponse.success("친구 목록을 조회했습니다.", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("올바르지 않은 상태값입니다."));
        } catch (Exception e) {
            log.error("친구 목록 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 목록 조회에 실패했습니다."));
        }
    }

    /**
     * 친구 삭제
     */
    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<String>> deleteFriend(
            @PathVariable Long friendId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            friendService.deleteFriend(userAccountId, friendId);

            return ResponseEntity.ok(ApiResponse.success("친구를 삭제했습니다.", null));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("친구 삭제 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 삭제에 실패했습니다."));
        }
    }

    /**
     * 친구 차단
     */
    @PostMapping("/{friendId}/block")
    public ResponseEntity<ApiResponse<String>> blockFriend(
            @PathVariable Long friendId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            friendService.blockFriend(userAccountId, friendId);

            return ResponseEntity.ok(ApiResponse.success(null, "친구를 차단했습니다."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("친구 차단 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 차단에 실패했습니다."));
        }
    }

    /**
     * 사용자 조회
     */
    @GetMapping("/candidate")
    public ResponseEntity<ApiResponse<PageResponseDto<FriendDto>>> getUsers(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search) {
        try {
            Page<UserAccounts> accounts = userService.getUsers(search, pageable);
            Page<FriendDto> friends = accounts.map(
                    (friend) -> FriendDto.from(friend, Status.ACTIVE)
            );
            PageResponseDto<FriendDto> response = PageResponseDto.of(friends);
            return ResponseEntity.ok(ApiResponse.success("친구 목록을 조회했습니다.", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("올바르지 않은 상태값입니다."));
        } catch (Exception e) {
            log.error("친구 목록 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("친구 목록 조회에 실패했습니다."));
        }
    }
}
