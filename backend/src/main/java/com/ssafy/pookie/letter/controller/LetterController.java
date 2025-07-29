package com.ssafy.pookie.letter.controller;

import com.ssafy.pookie.common.response.ApiResponse;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import com.ssafy.pookie.letter.dto.LetterRequestDto;
import com.ssafy.pookie.letter.dto.LetterResponseDto;
import com.ssafy.pookie.letter.service.LetterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/letter")
@RequiredArgsConstructor
@Slf4j
public class LetterController {

    private final LetterService letterService;

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<List<LetterResponseDto>>> getReceivedLetter(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userAccountId = userDetails.getUserAccountId();
        List<LetterResponseDto> letters = letterService.getReceivedLetters(userAccountId);
        return ResponseEntity.ok(ApiResponse.success("받은 쪽지가 조회되었습니다.", letters));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<LetterResponseDto>>> getSentLetter(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userAccountId = userDetails.getUserAccountId();
        List<LetterResponseDto> letters = letterService.getSentLetters(userAccountId);
        return ResponseEntity.ok(ApiResponse.success("보낸 쪽지가 조회되었습니다.", letters));
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
        Long userAccountId = userDetails.getUserAccountId();
        LetterResponseDto responseDto = letterService.sendLetter(userAccountId, letterRequest);
        return ResponseEntity.ok(ApiResponse.success("메세지를 보냈습니다", responseDto));
    }
}
