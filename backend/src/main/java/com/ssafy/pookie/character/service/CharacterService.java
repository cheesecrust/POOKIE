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
     * 경험치 증가 및 필요 시 레벨업
     */
    @Transactional
    public UserCharacters levelUpMyPookie(Long userAccountId, UserCharacters userCharacter, int requiredExpForStepUp) {

        // 레벨업 조건 충족 시 처리
        if (userCharacter.getExp() >= requiredExpForStepUp) {
            userCharacter.resetExp();
            int currentStep = userCharacter.getCharacter().getStep();
            PookieType currentType = userCharacter.getCharacter().getType();

            List<Characters> candidates = null;
            if (currentStep == 0) {
                candidates = charactersRepository.findByStep(1);
            } else if (currentStep == 1) {
                candidates = charactersRepository.findCharactersByTypeAndStep(currentType, 2);
            }

            if (candidates != null && !candidates.isEmpty()) {
                Characters nextChar = getRandomCharacter(candidates);
                userCharacter.changeCharacter(nextChar);

                CharacterCatalog catalog = setPookieCatalogIfNotExists(
                        userCharacter.getUserAccount(), nextChar.getStep(), nextChar.getType()
                );
                changeRepState(userCharacter.getUserAccount(), catalog.getCharacter(), true);
            }
        }

        return userCharactersRepository.save(userCharacter);
    }

    /**
     * user의 도감 조회하기
     */
    public List<CharacterCatalog> getPookiesByUserId(Long userAccountId) {
        return characterCatalogRepository.findCharacterCatalogByUserAccountId(userAccountId);
    }

    /**
     * 대표 푸딩 가져오기
     */
    public Characters getRepPookie(Long userAccountId) {
        List<CharacterCatalog> catalog =
                characterCatalogRepository.findCharacterCatalogByUserAccountIdAndIsRepresent(userAccountId, true);

        if (catalog.size() > 2) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (catalog.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        return catalog.get(0).getCharacter();
    }

    /**
     * 대표 푸딩 바꾸기
     */
    @Transactional
    public void changeRepPookie(UserAccounts userAccount, PookieType pookieType, int step) {
        CharacterCatalog catalog = characterCatalogRepository
                .findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        if (catalog == null) throw new CustomException(ErrorCode.CHARACTER_NOT_FOUND);

        changeRepState(userAccount, catalog.getCharacter(), true);
    }

    public void changeRepState(UserAccounts userAccount, Characters character, boolean reqState) {
        CharacterCatalog catalog = characterCatalogRepository
                .findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), character.getStep(), character.getType())
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        catalog.updateIsRep(reqState);
        characterCatalogRepository.save(catalog);
    }

    /**
     * 나의 푸딩 조회하기
     */
    public UserCharacters findMyPookieByUserId(Long userAccountId) {
        List<UserCharacters> userCharacters =
                userCharactersRepository.findUserCharactersByUserAccountIdAndIsDrop(userAccountId, true);

        if (userCharacters.size() > 2) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);
        if (userCharacters.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        return userCharacters.get(0);
    }

    /**
     * 푸딩 지급하기 (Characters 반환)
     */
    @Transactional
    public Characters setUserPookie(UserAccounts userAccount, PookieType pookieType) {
        Characters character = charactersRepository.findCharactersByType(pookieType)
                .stream()
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        log.info("✅ 캐릭터 조회 성공: id={}, name={}", character.getId(), character.getName());

        if (userAccount.getId() == null) {
            throw new CustomException(ErrorCode.INVALID_USER_ACCOUNT);
        }

        try {
            UserCharacters userCharacters = UserCharacters.builder()
                    .userAccount(userAccount)
                    .character(character)
                    .exp(0)
                    .isDrop(false)
                    .build();

            userCharactersRepository.save(userCharacters);
            return character;
        } catch (Exception e) {
            log.error("❌ UserCharacters 저장 중 에러", e);
            throw new CustomException(ErrorCode.INTERNAL_ERROR);
        }
    }

    public void setPookieCatalog(UserAccounts userAccount, int step, PookieType pookieType) {
        CharacterCatalog catalog = characterCatalogRepository
                .findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));


        if (catalog != null) return;

        Characters character = charactersRepository.findCharactersByTypeAndStep(pookieType, step).get(0);
        catalog = CharacterCatalog.builder()
                .userAccount(userAccount)
                .character(character)
                .isRepresent(false)
                .build();

        characterCatalogRepository.save(catalog);
    }

    /**
     * 아이템 사용 시 경험치 추가 및 필요 시 레벨업
     */
    @Transactional(rollbackFor = Exception.class)
    public UserCharacters feedMyPookie(Long userAccountId, int expFromItem) {
        // 대표 푸딩 확인
        Characters repCharacter = getRepPookie(userAccountId);

        userCharactersRepository.findByUserAccountIdAndCharacterId(userAccountId, repCharacter.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.REP_POKIE_NOT_FOUND));

        // 경험치 증가 + 필요 시 레벨업은 levelUpMyPookie 호출로 처리
        // TODO: 캐릭터 도감 엔티티에 키우는 캐릭터 필드 추가 후
        List<UserCharacters> userCharacters =
                userCharactersRepository.findUserCharactersByUserAccountIdAndIsDrop(userAccountId, false);

        if (userCharacters.isEmpty()) throw new CustomException(ErrorCode.REP_POKIE_NOT_FOUND);

        if (userCharacters.size() > 2) throw new CustomException(ErrorCode.TOO_MANY_POOKIES);

        UserCharacters userCharacter = userCharacters.get(0);
        userCharacter.upExp(expFromItem);

        int currentStep = userCharacter.getCharacter().getStep();
        PookieType currentType = userCharacter.getCharacter().getType();
        int requiredExpForStepUp = ExpThreshold.getRequiredExpForStep(currentStep);

        // 레벨업 조건 충족 시 처리
        if (userCharacter.getExp() >= requiredExpForStepUp) {
            return levelUpMyPookie(userAccountId, userCharacter, requiredExpForStepUp);
        }

        return userCharactersRepository.save(userCharacter);
    }

    private Characters getRandomCharacter(List<Characters> candidates) {
        Random random = new Random();
        return candidates.get(random.nextInt(candidates.size()));
    }

    private CharacterCatalog setPookieCatalogIfNotExists(UserAccounts userAccount, int step, PookieType pookieType) {
        boolean exists = characterCatalogRepository
                .existsByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType);

        if (!exists) {
            Characters character = charactersRepository.findCharactersByTypeAndStep(pookieType, step).get(0);
            CharacterCatalog catalog = CharacterCatalog.builder()
                    .userAccount(userAccount)
                    .character(character)
                    .isRepresent(false)
                    .build();
            return characterCatalogRepository.save(catalog);
        }

        CharacterCatalog characterCatalog = characterCatalogRepository
                .findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_NOT_FOUND));

        return characterCatalog;
    }
}