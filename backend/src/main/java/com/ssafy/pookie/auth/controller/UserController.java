package com.ssafy.pookie.auth.controller;

import com.ssafy.pookie.auth.dto.*;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.service.CharacterService;
import org.springframework.web.bind.annotation.RestController;
import com.ssafy.pookie.auth.service.UserService;
import com.ssafy.pookie.common.response.ApiResponse;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CharacterService characterService;

    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponseDto>> signup(
            @Valid @RequestBody SignupRequestDto signupRequest) {
        log.info("회원가입 요청: email={}", signupRequest.getEmail());
        try {
            SignupResponseDto response = userService.signup(signupRequest);

            log.info("회원가입 성공: userId={}", response.getUserId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("회원가입이 완료되었습니다.", response));

        } catch (Exception e) {
            log.error("회원가입 실패: email={}, error={}", signupRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("회원가입에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(
            @Valid @RequestBody LoginRequestDto loginRequest) {
        log.info("로그인 요청: email={}", loginRequest.getEmail());
        try {
            LoginResponseDto response = userService.login(loginRequest);

            log.info("로그인 성공: userId={}", response.getUserAccountId());

            return ResponseEntity.ok(ApiResponse.success("로그인에 성공했습니다.", response));

        } catch (Exception e) {
            log.error("로그인 실패: email={}, error={}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("로그아웃 요청");
        try {
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }

            userService.logout(token);

            log.info("로그아웃 성공");

            return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다.", null));

        } catch (Exception e) {
            log.error("로그아웃 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("로그아웃에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDto>> refreshToken(
            @RequestHeader("Authorization") String refreshToken) {
        log.info("토큰 갱신 요청");
        try {
            String token = refreshToken.startsWith("Bearer ") ?
                    refreshToken.substring(7) : refreshToken;

            LoginResponseDto response = userService.refreshToken(token);

            log.info("토큰 갱신 성공");

            return ResponseEntity.ok(ApiResponse.success("토큰이 갱신되었습니다.", response));
        } catch (Exception e) {
            log.error("토큰 갱신 실패: error={}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("토큰 갱신에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 이메일 중복 확인
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailDuplicate(
            @RequestParam String email) {
        log.info("이메일 중복 확인 요청: email={}", email);
        try {
            boolean isDuplicate = userService.isEmailDuplicate(email);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            isDuplicate ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다.",
                            isDuplicate
                    )
            );

        } catch (Exception e) {
            log.error("이메일 중복 확인 실패: email={}, error={}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("이메일 중복 확인에 실패했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUserInfo(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Characters userCharacter = characterService.getRepPookie(userDetails.getUserAccountId());

        UserResponseDto userResponseDto = UserResponseDto.builder()
                .userAccountId(userDetails.getUserAccountId())
                .email(userDetails.getEmail())
                .nickname(userDetails.getNickname())
                .repCharacter(userCharacter)
                .build();

        return ResponseEntity.ok(ApiResponse.success("사용자 정보", userResponseDto));
    }
}
