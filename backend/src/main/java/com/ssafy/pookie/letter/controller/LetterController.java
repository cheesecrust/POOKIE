package com.ssafy.pookie.letter.controller;

import com.ssafy.pookie.common.dto.PageResponseDto;
import com.ssafy.pookie.common.response.ApiResponse;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import com.ssafy.pookie.letter.dto.CombinedMessageDto;
import com.ssafy.pookie.letter.dto.LetterRequestDto;
import com.ssafy.pookie.letter.dto.LetterResponseDto;
import com.ssafy.pookie.letter.service.LetterService;
import com.ssafy.pookie.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/letter")
@RequiredArgsConstructor
@Slf4j
public class LetterController {

    private final LetterService letterService;
    private final NotificationService notificationService;

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<PageResponseDto<CombinedMessageDto>>> getReceivedLetter(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userAccountId = userDetails.getUserAccountId();
        Page<CombinedMessageDto> letters = letterService.getReceivedLetters(userAccountId, pageable);
        PageResponseDto<CombinedMessageDto> response = PageResponseDto.of(letters);
        return ResponseEntity.ok(ApiResponse.success("받은 쪽지가 조회되었습니다.", response));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<PageResponseDto<CombinedMessageDto>>> getSentLetter(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userAccountId = userDetails.getUserAccountId();
        Page<CombinedMessageDto> letters = letterService.getSentLetters(userAccountId, pageable);
        PageResponseDto<CombinedMessageDto> pageResponseDto = PageResponseDto.of(letters);
        return ResponseEntity.ok(ApiResponse.success("보낸 쪽지가 조회되었습니다.", pageResponseDto));
    }

    @GetMapping("/{letterId}/detail")
    public ResponseEntity<ApiResponse<LetterResponseDto>> getLetterDetail(
            @PathVariable Long letterId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            LetterResponseDto letter = letterService.getLetterDetail(userAccountId, letterId);
            return ResponseEntity.ok(ApiResponse.success("쪽지가 조회되었습니다.", letter));
        } catch (Exception e) {
            log.error(e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{letterId}")
    public ResponseEntity<ApiResponse<?>> deleteLetter(
            @PathVariable Long letterId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userAccountId = userDetails.getUserAccountId();
        boolean result = letterService.deleteLetters(userAccountId, letterId);
        if (result) {
            return ResponseEntity.ok(ApiResponse.success("삭제되었습니다.", result));
        }
        return ResponseEntity.ok(ApiResponse.error("삭제 실패하였습니다."));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LetterResponseDto>> sendLetter(
            @RequestBody LetterRequestDto letterRequest,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userAccountId = userDetails.getUserAccountId();
            LetterResponseDto responseDto = letterService.sendLetter(userAccountId, letterRequest);
            notificationService.sendRequestEvent(letterRequest.getReceiverId());
            return ResponseEntity.ok(ApiResponse.success("메세지를 보냈습니다", responseDto));
        } catch (Exception e) {
            log.info("알림을 보내는것에 오류가 발생하였습니다.");
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/report/{letterId}")
    public ResponseEntity<ApiResponse<?>> reportLetter(
            @PathVariable Long letterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        Long userAccountId = userDetails.getUserAccountId();
        boolean result = letterService.reportLetters(userAccountId, letterId);
        return ResponseEntity.ok(ApiResponse.success("신고되었습니다.", result));
    }
}
