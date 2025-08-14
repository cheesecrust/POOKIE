package com.ssafy.pookie.character.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.dto.CharacterCatalogResponseDto;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import com.ssafy.pookie.character.dto.UserCharactersResponseDto;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.model.UserCharacters;
import com.ssafy.pookie.character.repository.CharacterCatalogRepository;
import com.ssafy.pookie.character.repository.CharactersRepository;
import com.ssafy.pookie.character.repository.UserCharactersRepository;
import com.ssafy.pookie.global.constants.ExpThreshold;
import com.ssafy.pookie.global.exception.CustomException;
import com.ssafy.pookie.global.exception.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterCatalogRepository characterCatalogRepository;
    private final CharactersRepository charactersRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final UserCharactersRepository userCharactersRepository;

    // ----------------------------
    // 조회 계열
    // ----------------------------

    /** user의 도감 조회하기 */
    @Transactional(readOnly = true)
    public List<CharacterCatalogResponseDto> getPookiesByUserId(Long userAccountId) {
        return CharacterCatalogResponseDto.fromEntity(
                characterCatalogRepository.findByUserAccount_Id(userAccountId)
        );
    }

    /** 성장하는 푸키(종) 가져오기 */
    @Transactional(readOnly = true)
    public Characters getGrowingPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findByUserAccount_IdAndIsGrowing(userAccountId, true);

        if (catalog.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.GROWING_POKIE_NOT_FOUND);

        return catalog.get(0).getCharacter();
    }

    /** 대표 푸키(개체) 가져오기 */
    @Transactional(readOnly = true)
    public RepCharacterResponseDto getRepPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findByUserAccount_IdAndIsRepresent(userAccountId, true);

        if (catalog.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        int characterId = catalog.get(0).getCharacter().getId();

        // 같은 종 개체가 여러 개일 수 있으니 "활성 최신" 한 개체를 고른다.
        UserCharacters repUserCharacters = userCharactersRepository
                .findTopByUserAccount_IdAndCharacter_IdAndIsDropFalseOrderByCreatedAtDesc(userAccountId, characterId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        return RepCharacterResponseDto.fromEntity(repUserCharacters);
    }

    /** 나의 푸키 조회하기 (growing → 대표 → 활성 최신) */
    @Transactional(readOnly = true)
    public UserCharactersResponseDto findMyPookieByUserId(Long userAccountId) {
        // 1) growing 우선
        List<CharacterCatalog> growing = characterCatalogRepository
                .findByUserAccount_IdAndIsGrowing(userAccountId, true);
        if (!growing.isEmpty()) {
            int characterId = growing.get(0).getCharacter().getId();
            UserCharacters uc = userCharactersRepository
                    .findTopByUserAccount_IdAndCharacter_IdAndIsDropFalseOrderByCreatedAtDesc(userAccountId, characterId)
                    .orElseThrow(() -> new CustomException(ErrorCode.GROWING_POKIE_NOT_FOUND));
            return UserCharactersResponseDto.fromEntity(uc);
        }

        // 2) 대표 다음
        List<CharacterCatalog> reps = characterCatalogRepository
                .findByUserAccount_IdAndIsRepresent(userAccountId, true);
        if (!reps.isEmpty()) {
            int characterId = reps.get(0).getCharacter().getId();
            UserCharacters uc = userCharactersRepository
                    .findTopByUserAccount_IdAndCharacter_IdAndIsDropFalseOrderByCreatedAtDesc(userAccountId, characterId)
                    .orElseThrow(() -> new CustomException(ErrorCode.REP_POKIE_NOT_FOUND));
            return UserCharactersResponseDto.fromEntity(uc);
        }

        // 3) 마지막 fallback: 유저의 활성 최신 개체 하나
        UserCharacters latest = userCharactersRepository.findByUserAccount_IdAndIsDrop(userAccountId, false).stream()
                .max(Comparator.comparing(UserCharacters::getCreatedAt))
                .orElseThrow(() -> new CustomException(ErrorCode.REP_POKIE_NOT_FOUND));

        return UserCharactersResponseDto.fromEntity(latest);
    }

    // ----------------------------
    // 상태 변경 계열
    // ----------------------------

    /** 대표 푸키 바꾸기 (도감 플래그 기반) */
    @Transactional
    public void changeRepPookie(Long currentUserId, int characterCatalogId, int characterId) {
        UserAccounts userAccount = userAccountsRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        CharacterCatalog catalog = characterCatalogRepository
                .findOne(characterCatalogId, characterId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        if (catalog.isRepresent()) return; // 이미 대표면 무시

        changeCatalogStates(userAccount, catalog.getCharacter(), true, catalog.isGrowing());
    }

    /** Base 푸키 새로 지급하기 (기존 사용자에게) */
    @Transactional
    public UserCharactersResponseDto setUserNewPookie(Long userAccountId) {
        UserAccounts userAccount = userAccountsRepository.findById(userAccountId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return setUserInitPookie(userAccount);
    }

    /** Base 푸키 지급하기 (처음 지급 or 새로운 푸키 받기)  */
    @Transactional
    public UserCharactersResponseDto setUserInitPookie(UserAccounts userAccount) {
        // 1) 지급 가능 여부 검증
        boolean hasAnyCharacter = userCharactersRepository.existsByUserAccount_Id(userAccount.getId());
        boolean hasGrowingCatalog = characterCatalogRepository.existsByUserAccount_IdAndIsGrowingTrue(userAccount.getId());

        if (hasAnyCharacter && hasGrowingCatalog) {
            throw new CustomException(ErrorCode.POOKIE_ALREADY_GROWING);
        }

        // 2) BASE 종
        Characters base = charactersRepository.findCharactersByType(PookieType.BASE)
                .stream().findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        // 3) UserCharacters upsert (여러 개 허용 정책, 기존 있으면 exp만 초기화)
        UserCharacters uc = userCharactersRepository
                .findByUserAccount_IdAndCharacter_Id(userAccount.getId(), base.getId())
                .map(ex -> { ex.resetExp(); return ex; })
                .orElseGet(() -> UserCharacters.builder()
                        .userAccount(userAccount).character(base)
                        .exp(0).isDrop(false)
                        .build());

        uc = userCharactersRepository.save(uc);

        // 4) 도감 upsert
        setPookieCatalogIfNotExists(userAccount, base);

        // 5) 도감 플래그: 대표/성장 = true/true
        updateCatalogStates(userAccount, base, true, true);

        log.info("✅ Base 지급 완료: userId={}, characterId={}, step={}, rep={}, grow={}",
                userAccount.getId(), base.getId(), base.getStep(), true, true);

        return UserCharactersResponseDto.fromEntity(uc);
    }

    /** 아이템 사용 → exp 증가 → 필요 시 레벨업 → DTO 반환 */
    @Transactional(rollbackFor = Exception.class)
    public UserCharactersResponseDto feedMyPookie(Long userAccountId, int expFromItem) {
        Characters growingPookieCharacter = getGrowingPookie(userAccountId);

        // 같은 종 개체가 여러 개일 수 있으니 "활성 최신"을 선택
        UserCharacters userCharacter = userCharactersRepository
                .findTopByUserAccount_IdAndCharacter_IdAndIsDropFalseOrderByCreatedAtDesc(
                        userAccountId, growingPookieCharacter.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.REP_POKIE_NOT_FOUND));

        int currentStep = userCharacter.getCharacter().getStep();
        userCharacter.upExp(expFromItem);

        int requiredExpForStepUp = ExpThreshold.getRequiredExpForStep(currentStep);
        log.info("피딩: userId={}, characterId={}, step={}, expAfter={}, required={}",
                userAccountId, userCharacter.getCharacter().getId(), currentStep, userCharacter.getExp(), requiredExpForStepUp);

        if (userCharacter.getExp() >= requiredExpForStepUp) {
            // 레벨업 진행
            return levelUpMyPookie(userAccountId, userCharacter, requiredExpForStepUp);
        }

        return UserCharactersResponseDto.fromEntity(userCharactersRepository.save(userCharacter));
    }

    /** 현재 키우는 푸키 레벨업 → DTO 반환 */
    @Transactional
    public UserCharactersResponseDto levelUpMyPookie(Long userAccountId, UserCharacters userCharacter, int requiredExpForStepUp) {
        if (userCharacter.getExp() < requiredExpForStepUp) {
            log.info("레벨업 조건 미달: userId={}, exp={}, required={}", userAccountId, userCharacter.getExp(), requiredExpForStepUp);
            return UserCharactersResponseDto.fromEntity(userCharacter);
        }

        // cap exp
        userCharacter.setMaxExpForLevelUp(requiredExpForStepUp);
        userCharactersRepository.save(userCharacter);

        int currentStep = userCharacter.getCharacter().getStep();
        PookieType currentType = userCharacter.getCharacter().getType();

        List<Characters> candidates = (currentStep == 0)
                ? charactersRepository.findByStep(1)
                : charactersRepository.findCharactersByTypeAndStep(currentType, 2);

        if (candidates == null || candidates.isEmpty()) {
            return UserCharactersResponseDto.fromEntity(userCharacter); // 더 이상 진화 없음
        }

        Characters nextChar = getRandomCharacter(candidates);

        // 새 개체 생성(여러 개 허용)
        UserCharacters newUserCharacter = UserCharacters.builder()
                .userAccount(userCharacter.getUserAccount())
                .character(nextChar)
                .exp(0)
                .isDrop(false)
                .build();
        newUserCharacter = userCharactersRepository.save(newUserCharacter);

        // 도감 upsert
        setPookieCatalogIfNotExists(userCharacter.getUserAccount(), nextChar);

        // 플래그 전이 정책
        if (currentStep == 0) {
            updateCatalogStates(userCharacter.getUserAccount(), nextChar, true, true);
        } else if (currentStep == 1) {
            updateCatalogStates(userCharacter.getUserAccount(), nextChar, true, false);
        }

        log.info("레벨업 완료: userId={}, fromCharId={}, toCharId={}, fromStep={}, toStep(?)",
                userAccountId, userCharacter.getCharacter().getId(), nextChar.getId(), currentStep, nextChar.getStep());

        // 다음 개체를 응답으로 주는 게 UX에 자연스러움
        return UserCharactersResponseDto.fromEntity(newUserCharacter);
    }

    // ----------------------------
    // 내부 유틸
    // ----------------------------

    /** 도감에 푸키 등록 (없으면 생성) */
    @Transactional(propagation = Propagation.MANDATORY)
    protected CharacterCatalog setPookieCatalogIfNotExists(UserAccounts userAccount, Characters newChar) {
        return characterCatalogRepository
                .findByUserAccount_IdAndCharacter_Id(userAccount.getId(), newChar.getId())
                .orElseGet(() -> characterCatalogRepository.save(
                        CharacterCatalog.builder()
                                .userAccount(userAccount)
                                .character(newChar)
                                .isRepresent(false)
                                .isGrowing(false)
                                .build()
                ));
    }

    /** 도감 상태 업데이트 (대표/성장 동기화) : reset → set */
    @Transactional(propagation = Propagation.MANDATORY)
    protected void updateCatalogStates(UserAccounts user, Characters character, boolean represent, boolean growing) {
        // 도감 행 보장
        setPookieCatalogIfNotExists(user, character);

        // reset → set
        characterCatalogRepository.resetAllRepresent(user.getId());
        characterCatalogRepository.resetAllGrowing(user.getId());

        characterCatalogRepository.updateCatalogState(user.getId(), character.getId(), represent, growing);

        // Lazy 필드 접근 피해서 id로만 로깅
        log.info("도감 상태 업데이트: userId={}, characterId={}, rep={}, grow={}",
                user.getId(), character.getId(), represent, growing);
    }

    /** 도감 상태 업데이트 (대표/성장 동기화) : reset → set */
    @Transactional(propagation = Propagation.MANDATORY)
    protected void changeCatalogStates(UserAccounts user, Characters character, boolean represent, boolean growing) {
        // 도감 행 보장
        setPookieCatalogIfNotExists(user, character);

        // reset → set
        characterCatalogRepository.resetAllRepresent(user.getId());

        characterCatalogRepository.updateCatalogState(user.getId(), character.getId(), represent, growing);

        // Lazy 필드 접근 피해서 id로만 로깅
        log.info("도감 상태 업데이트: userId={}, characterId={}, rep={}, grow={}",
                user.getId(), character.getId(), represent, growing);
    }

    private Characters getRandomCharacter(List<Characters> candidates) {
        int idx = ThreadLocalRandom.current().nextInt(candidates.size());
        return candidates.get(idx);
    }
}