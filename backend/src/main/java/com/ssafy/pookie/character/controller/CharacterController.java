package com.ssafy.pookie.character.controller;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.ChangeRepPookieRequestDto;
import com.ssafy.pookie.character.dto.CharacterCatalogResponseDto;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/characters")
@RequiredArgsConstructor
@Slf4j
public class CharacterController {

    private final CharacterService characterService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserAccountsRepository userAccountsRepository;

    /**
     * 사용자의 모든 캐릭터 카탈로그 조회
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<CharacterCatalogResponseDto>> getUserCharacterCatalog(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            
            List<CharacterCatalogResponseDto> catalogResponseDtos = characterService.getPookiesByUserId(currentUserId);
            return ResponseEntity.ok(catalogResponseDtos);
        } catch (Exception e) {
            log.error("캐릭터 카탈로그 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 대표 푸키 조회
     */
    @GetMapping("/representative")
    public ResponseEntity<RepCharacterResponseDto> getRepresentativePookie(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            RepCharacterResponseDto repPookie = characterService.getRepPookie(currentUserId);
            return ResponseEntity.ok(repPookie);
        } catch (Exception e) {
            log.error("대표 푸키 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 대표 푸키 변경
     */
    @PutMapping("/representative")
    public ResponseEntity<String> changeRepresentativePookie(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ChangeRepPookieRequestDto request) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            UserAccounts userAccount = userAccountsRepository.findById(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            characterService.changeRepPookie(userAccount, request.getPookieType(), request.getStep());
            
            return ResponseEntity.ok("대표 푸키가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            log.error("대표 푸키 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("대표 푸키 변경 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }

    /**
     * 내가 키우는 푸키 조회
     */
    @GetMapping("/my-pookie")
    public ResponseEntity<Object> getMyPookie(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            var myPookie = characterService.findMyPookieByUserId(currentUserId);
            return ResponseEntity.ok(myPookie);
        } catch (Exception e) {
            log.error("내 푸키 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}