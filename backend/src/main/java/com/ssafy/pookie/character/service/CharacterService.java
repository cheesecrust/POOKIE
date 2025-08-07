package com.ssafy.pookie.character.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
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

import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterCatalogRepository characterCatalogRepository;
    private final CharactersRepository charactersRepository;
    private final UserCharactersRepository userCharactersRepository;

    /**
     * 현재 키우는 푸키 레벨업
     */
    @Transactional
    public UserCharacters levelUpMyPookie(Long userAccountId, UserCharacters userCharacter, int requiredExpForStepUp) {
        // 레벨업 조건 미충족 시 그대로 반환
        if (userCharacter.getExp() < requiredExpForStepUp) {
            log.info("현재 step에서 최대 경험치 이상이므로 step up(level up) 진행 안합니다.");
            return userCharacter;
        }

        // 경험치 max로 고정(초과할 수 없으므로)
        userCharacter.setMaxExpForLevelUp(requiredExpForStepUp);
        userCharactersRepository.save(userCharacter);

        int currentStep = userCharacter.getCharacter().getStep();
        PookieType currentType = userCharacter.getCharacter().getType();

        List<Characters> candidates = null;
        log.info("현재 step: {}: ", currentStep);
        // 도감 등록할 새로운 캐릭터
        Characters nextChar = null;
        if (currentStep == 0) {
            candidates = charactersRepository.findByStep(1);
        } else if (currentStep == 1) {
            candidates = charactersRepository.findCharactersByTypeAndStep(currentType, 2);
        }

        if (candidates != null && !candidates.isEmpty()) {
            // 다음 캐릭터 랜덤 선택
            nextChar = getRandomCharacter(candidates);

            // user character에 저장
            UserCharacters newUserCharacter = UserCharacters.builder()
                                                    .userAccount(userCharacter.getUserAccount())
                                                    .character(nextChar)
                                                    .exp(0)
                                                    .isDrop(false)
                                                    .build();
            userCharactersRepository.save(newUserCharacter);

            // 도감 등록 및 상태 업데이트
            setPookieCatalogIfNotExists(userCharacter.getUserAccount(), nextChar);
        }

        if (currentStep == 0) {
            updateCatalogStates(userCharacter.getUserAccount(), nextChar, true, true);
        } else if (currentStep == 1) {
            // 레벨 1 -> 2로 최종 진화했을 경우 키우는
            // 최종 진화 → 성장 종료 (새로운 푸키 받기는 버튼으로 처리)

            updateCatalogStates(userCharacter.getUserAccount(), nextChar, true, false);
        }

        return userCharactersRepository.save(userCharacter);
    }

    /**
     * 도감 상태 업데이트 (대표/성장 동기화)
     */
    @Transactional
    public void updateCatalogStates(UserAccounts user, Characters character, boolean represent, boolean growing) {

       log.info("도감 상태 업데이트 시작합니다.");
        // 기존 대표/성장 상태 초기화 (bulk update)
        characterCatalogRepository.resetAllRepresent(user.getId());
        characterCatalogRepository.resetAllGrowing(user.getId());
        log.info("도감 상태 대표, 성장 모두 false로 두었습니다.");

        // bulk update
        characterCatalogRepository.updateCatalogState(user.getId(), character.getId(), represent, growing);
        log.info("현재 user account: {} 에서 캐릭터 이름: {}을 현재 도감 상태 대표: {}, 성장: {} 두었습니다."
                , user.getNickname(), character.getName(), represent, growing);
    }

    /**
     * user의 도감 조회하기
     */
    public List<CharacterCatalog> getPookiesByUserId(Long userAccountId) {
        return characterCatalogRepository.findByUserAccountId(userAccountId);
    }

    /**
     * 성장하는 푸키 가져오기
     */
    public Characters getGrowingPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findByUserAccountIdAndIsGrowing(userAccountId, true);

        if (catalog.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.GROWING_POKIE_NOT_FOUND);

        return catalog.get(0).getCharacter();
    }

    /**
     * 대표 푸키 가져오기
     */
    public RepCharacterResponseDto getRepPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findByUserAccountIdAndIsRepresent(userAccountId, true);

        if (catalog.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        Characters characters = catalog.get(0).getCharacter();
        UserCharacters repUserCharacters = userCharactersRepository
                            .findByUserAccountIdAndCharacterId(userAccountId, characters.getId())
                            .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        RepCharacterResponseDto repCharacterDto = RepCharacterResponseDto
                                                        .fromEntity(repUserCharacters);

        return repCharacterDto;
    }

    /**
     * 대표 푸키 바꾸기
     */
    @Transactional
    public void changeRepPookie(UserAccounts userAccount, PookieType pookieType, int step) {
        CharacterCatalog catalog = characterCatalogRepository
                .findByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        updateCatalogStates(userAccount, catalog.getCharacter(), true, catalog.isGrowing());
    }

    /**
     * 나의 푸키 조회하기
     */
    public UserCharacters findMyPookieByUserId(Long userAccountId) {
        List<UserCharacters> userCharacters =
                userCharactersRepository.findUserCharactersByUserAccountIdAndIsDrop(userAccountId, false);

        if (userCharacters.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (userCharacters.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        return userCharacters.get(0);
    }

    /**
     * 푸키 지급하기 (처음 지급 or 새로운 푸키 받기)
     */
    @Transactional
    public Characters setUserInitPookie(UserAccounts userAccount) {
        Characters character = charactersRepository.findCharactersByType(PookieType.BASE)
                .stream()
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        // UserCharacters 저장
        UserCharacters initChar = UserCharacters.builder()
                .userAccount(userAccount)
                .character(character)
                .exp(0)
                .isDrop(false)
                .build();

        // CharacterCatalog 등록 (없으면 생성)
        CharacterCatalog catalog = setPookieCatalogIfNotExists(userAccount,
                        userCharactersRepository.save(initChar).getCharacter());

        // 대표 & 성장 캐릭터로 지정
        updateCatalogStates(userAccount, catalog.getCharacter(), true, true);

        log.info("✅ 첫 푸키 지급 완료: userId={}, characterId={}, step={}, isRep={}, isGrowing={}",
                userAccount.getId(), character.getId(), character.getStep(), catalog.isRepresent(), catalog.isGrowing());

        return character;
    }

    /**
     * 도감에 푸키 등록 (없으면 새로 생성)
     */
    private CharacterCatalog setPookieCatalogIfNotExists(UserAccounts userAccount, Characters newChar) {

        return characterCatalogRepository
                .findByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), newChar.getStep(), newChar.getType())
                .orElseGet(() -> {

                    CharacterCatalog catalog = CharacterCatalog.builder()
                            .userAccount(userAccount)
                            .character(newChar)
                            .isRepresent(false)
                            .isGrowing(false)
                            .build();

                    return characterCatalogRepository.save(catalog);
                });
    }

    /**
     * 아이템 사용 시 경험치 추가 및 필요 시 레벨업
     */
    @Transactional(rollbackFor = Exception.class)
    public UserCharacters feedMyPookie(Long userAccountId, int expFromItem) {
        Characters growingPookieCharacter = getGrowingPookie(userAccountId);

        UserCharacters userCharacter = userCharactersRepository
                .findByUserAccountIdAndCharacterId(userAccountId, growingPookieCharacter.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.REP_POKIE_NOT_FOUND));

        int currentStep = userCharacter.getCharacter().getStep();
        log.info("현재 대표 캐릭터에게 아이템을 사용합니다. 대표 캐릭터: {}, 현재 경험치: {}, 현재 step: {}"
                , userCharacter.getCharacter(), userCharacter.getExp(), currentStep);

        userCharacter.upExp(expFromItem);

        log.info("현재 대표 캐릭터에게 아이템을 사용했습니다. 대표 캐릭터: {}, 현재 경험치: {}, 현재 step: {}"
                , userCharacter.getCharacter(), userCharacter.getExp(), currentStep);

        int requiredExpForStepUp = ExpThreshold.getRequiredExpForStep(currentStep);
        log.info("현재 step에서 레벨업 가능한 최대 경험치 이상: {}", requiredExpForStepUp);
        if (userCharacter.getExp() >= requiredExpForStepUp) {
            log.info("현재 step에서 최대 경험치 이상이므로 step up(level up) 진행합니다.");
            return levelUpMyPookie(userAccountId, userCharacter, requiredExpForStepUp);
        }

        return userCharactersRepository.save(userCharacter);
    }

    private Characters getRandomCharacter(List<Characters> candidates) {
        Random random = new Random();
        return candidates.get(random.nextInt(candidates.size()));
    }
}