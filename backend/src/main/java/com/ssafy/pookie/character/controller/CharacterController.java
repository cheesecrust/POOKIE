package com.ssafy.pookie.character.controller;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.ChangeRepPookieRequestDto;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/character")
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
    public ResponseEntity<List<CharacterCatalog>> getUserCharacterCatalog(
            @RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(token);
            
            List<CharacterCatalog> catalogs = characterService.getPookiesByUserId(userAccountId);
            return ResponseEntity.ok(catalogs);
        } catch (Exception e) {
            log.error("캐릭터 카탈로그 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 대표 푸키 조회
     */
    @GetMapping("/representative")
    public ResponseEntity<Characters> getRepresentativePookie(
            @RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(token);
            
            Characters repPookie = characterService.getRepPookie(userAccountId);
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
            @RequestHeader("Authorization") String authorization,
            @RequestBody ChangeRepPookieRequestDto request) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(token);
            
            UserAccounts userAccount = userAccountsRepository.findById(userAccountId)
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
            @RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(token);
            
            var myPookie = characterService.findMyPookieByUserId(userAccountId);
            return ResponseEntity.ok(myPookie);
        } catch (Exception e) {
            log.error("내 푸키 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}