package com.ssafy.pookie.character.controller;

import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.ChangeRepPookieRequestDto;
import com.ssafy.pookie.character.dto.CharacterCatalogResponseDto;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import com.ssafy.pookie.character.dto.UserCharactersResponseDto;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.UserCharacters;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import com.ssafy.pookie.global.exception.CustomException;
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
        } catch (CustomException e) {
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
        } catch (CustomException e) {
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

            characterService.changeRepPookie(currentUserId, request.getId(), request.getCharacterId());
            
            return ResponseEntity.ok("대표 푸키가 성공적으로 변경되었습니다.");
        } catch (CustomException e) {
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
    public ResponseEntity<UserCharactersResponseDto> getMyPookie(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            UserCharactersResponseDto myPookie = characterService.findMyPookieByUserId(currentUserId);
            return ResponseEntity.ok(myPookie);
        } catch (CustomException e) {
            log.error("내 푸키 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 새로운 푸키 발급받기
     */
    @PostMapping("/new-pookie")
    public ResponseEntity<UserCharactersResponseDto> postNewPookie(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long currentUserId = userDetails.getUserAccountId();
            UserCharactersResponseDto userCharacter = characterService.setUserNewPookie(currentUserId);

            return ResponseEntity.ok(userCharacter);
        } catch (CustomException e) {
            log.error("새로운 푸키 발급 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}