package com.ssafy.pookie.character.service;

import com.ssafy.pookie.auth.model.UserAccounts;
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

        // 경험치 초기화
        userCharacter.resetExp();

        int currentStep = userCharacter.getCharacter().getStep();
        PookieType currentType = userCharacter.getCharacter().getType();

        List<Characters> candidates = null;
        log.info("현재 step: {}: ", currentStep);
        if (currentStep == 0) {
            candidates = charactersRepository.findByStep(1);
        } else if (currentStep == 1) {
            candidates = charactersRepository.findCharactersByTypeAndStep(currentType, 2);
        }

        if (candidates != null && !candidates.isEmpty()) {
            // 기존 대표/성장 해제
            updateCatalogStates(userCharacter.getUserAccount(), userCharacter.getCharacter(), false, false);

            // 다음 캐릭터 선택 및 교체
            Characters nextChar = getRandomCharacter(candidates);
            userCharacter.changeCharacter(nextChar);

            // 도감 등록 및 상태 업데이트
            CharacterCatalog catalog = setPookieCatalogIfNotExists(
                    userCharacter.getUserAccount(), nextChar.getStep(), nextChar.getType()
            );
            updateCatalogStates(userCharacter.getUserAccount(), catalog.getCharacter(), true, true);

        } else if (currentStep == 2) {
            // 레벨 1 -> 2로 최종 진화했을 경우 키우는
            // 최종 진화 → 성장 종료 (새로운 푸키 받기는 버튼으로 처리)
            updateCatalogStates(userCharacter.getUserAccount(), userCharacter.getCharacter(), true, false);
        }

        return userCharactersRepository.save(userCharacter);
    }

    /**
     * 도감 상태 업데이트 (대표/성장 동기화)
     */
    @Transactional
    public void updateCatalogStates(UserAccounts user, Characters character, boolean represent, boolean growing) {

       log.info("도감 상태 업데이트 시작합니다.");
        // 기존 대표/성장 상태 초기화 (bulk update → 영속성 깨짐)
        characterCatalogRepository.resetAllRepresent(user.getId());
        characterCatalogRepository.resetAllGrowing(user.getId());
        log.info("도감 상태 대표, 성장 모두 false로 두었습니다.");

        // bulk update 이후 다시 조회해서 최신 영속 엔티티 확보
        CharacterCatalog refreshedCatalog = characterCatalogRepository
                .findByUserAccountAndCharacter(user, character)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        // 대표/성장 상태 반영
        refreshedCatalog.updateIsRep(represent);
        refreshedCatalog.updateIsGrowing(growing);

        // save 대상은 refreshedCatalog
        characterCatalogRepository.save(refreshedCatalog);
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
    public Characters getRepPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findByUserAccountIdAndIsRepresent(userAccountId, true);

        if (catalog.size() > 1) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        return catalog.get(0).getCharacter();
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
    public Characters setUserPookie(UserAccounts userAccount, PookieType pookieType) {
        Characters character = charactersRepository.findCharactersByType(pookieType)
                .stream()
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        // UserCharacters 저장
        UserCharacters userCharacters = UserCharacters.builder()
                .userAccount(userAccount)
                .character(character)
                .exp(0)
                .isDrop(false)
                .build();
        userCharactersRepository.save(userCharacters);

        // CharacterCatalog 등록 (없으면 생성)
        CharacterCatalog catalog = setPookieCatalogIfNotExists(
                userAccount, character.getStep(), character.getType()
        );

        // 대표 & 성장 캐릭터로 지정
        updateCatalogStates(userAccount, catalog.getCharacter(), true, true);

        log.info("✅ 첫 푸키 지급 완료: userId={}, characterId={}, step={}",
                userAccount.getId(), character.getId(), character.getStep());

        return character;
    }

    /**
     * 도감에 푸키 등록 (없으면 새로 생성)
     */
    private CharacterCatalog setPookieCatalogIfNotExists(UserAccounts userAccount, int step, PookieType pookieType) {
        return characterCatalogRepository
                .findByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType)
                .orElseGet(() -> {
                    Characters character = charactersRepository.findCharactersByTypeAndStep(pookieType, step)
                            .stream()
                            .findFirst()
                            .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

                    CharacterCatalog catalog = CharacterCatalog.builder()
                            .userAccount(userAccount)
                            .character(character)
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