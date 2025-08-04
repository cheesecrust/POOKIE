package com.ssafy.pookie.character.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.character.model.CharacterCatalog;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.model.UserCharacters;
import com.ssafy.pookie.character.repository.CharacterCatalogRepository;
import com.ssafy.pookie.character.repository.CharactersRepository;
import com.ssafy.pookie.character.repository.UserCharactersRepository;
import com.ssafy.pookie.global.constants.ExpThreshold;
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
    private final UserAccountsRepository userAccountsRepository;

    /**
     * 내가 키우는 캐릭터 레벨업 하기
     */
    public UserCharacters levelUpMyPookie(Long userAccountId, int addedExp) throws RuntimeException {
        List<UserCharacters> userCharacters = userCharactersRepository.findUserCharactersByUserAccountIdAndIsDrop(userAccountId, true);
        if (userCharacters.size() > 2) throw new RuntimeException("pookie 수 문제");
        UserCharacters userCharacter = userCharacters.get(0);
        userCharacter.upExp(addedExp);
        userCharactersRepository.save(userCharacter);
        return userCharacter;
    }
    
    /**
     * user의 도감 조회하기
     */
    public List<CharacterCatalog> getPookiesByUserId(Long userAccountId) {
        return characterCatalogRepository.findCharacterCatalogByUserAccountId(userAccountId);
    }

    /**
     * 나의 푸딩 파양하기
     */
    public void dropUserPookie(Long userAccountId) {

    }

    /**
     * 대표 푸딩 가져오기
     * 대표 푸딩은 도감에서 대표로 설정된 푸딩을 가져온다.
     */
    public Characters getRepPookie(Long userAccountId) throws RuntimeException {
        List<CharacterCatalog> catalog = characterCatalogRepository.findCharacterCatalogByUserAccountIdAndIsRepresent(userAccountId, true);
        if (catalog.size() > 2) throw new RuntimeException("pookie 대표 수 문제");
        return catalog.get(0).getCharacter();
    }

    /**
     * 대표 푸딩 바꾸기
     * 대표 푸딩은 도감에서 대표로 설정된 푸딩을 가져온다.
     */
    @Transactional
    public void changeRepPookie(UserAccounts userAccount, PookieType pookieType, int step) throws RuntimeException {
        CharacterCatalog catalog = characterCatalogRepository.findCharacterCatalogByUserAccountAndCharacterStepAndCharacterType(
                userAccount, step, pookieType
        );
        if (catalog == null) throw new RuntimeException("그런 푸킨 없다.");

//        CharacterCatalog presentCatalog = characterCatalogRepository
//                .findCharacterCatalogByUserAccountAndIsRepresent(userAccount, true)
//                .get(0);

        changeRepState(userAccount, catalog.getCharacter(), true);
//        changeRepState(userAccount, presentCatalog.getCharacter(), false);
    }

    public void changeRepState(UserAccounts userAccount, Characters character, boolean reqState) {
        CharacterCatalog catalog = characterCatalogRepository
                .findCharacterCatalogByUserAccountAndCharacter(userAccount, character)
                .get(0);
        catalog.updateIsRep(reqState);
        characterCatalogRepository.save(catalog);
    }

    /**
     * 나의 푸딩 조회하기
     */
    public UserCharacters findMyPookieByUserId(Long userAccountId) {
        List<UserCharacters> userCharacters = userCharactersRepository.findUserCharactersByUserAccountIdAndIsDrop(userAccountId, true);
        if (userCharacters.size() > 2) throw new RuntimeException("pookie 수 문제");
        return userCharacters.get(0);
    }

    /**
     * 푸딩 지급하기
     */
    public Characters setUserPookie(UserAccounts userAccount, PookieType pookieType) {
        Characters character = charactersRepository.findCharactersByType(pookieType).get(0);
        log.info("✅ 캐릭터 조회 성공: id={}, name={}", character.getId(), character.getName());
        log.info("✅ userAccount id={}", userAccount.getId());

        // 영속 상태 체크
        if (userAccount.getId() == null) {
            throw new IllegalStateException("❌ userAccount가 아직 DB에 저장되지 않았습니다.");
        }

        try {
            UserCharacters userCharacters = UserCharacters.builder()
                    .userAccount(userAccount)
                    .character(character)
                    .exp(0)
                    .isDrop(false)
                    .build();

            UserCharacters saved = userCharactersRepository.save(userCharacters);
            log.info("✅ UserCharacters 저장 완료: {}", saved.getId());

            return character;
        } catch (Exception e) {
            log.error("❌ UserCharacters 저장 중 에러", e);
            throw e;
        }
    }


    public void setPookieCatalog(UserAccounts userAccount, int step, PookieType pookieType) {
        CharacterCatalog catalog = characterCatalogRepository.findCharacterCatalogByUserAccountIdAndCharacterStepAndCharacterType(
                userAccount.getId(), step, pookieType
        );
        if (catalog != null) return;
        System.out.println("qw");
        Characters character = charactersRepository.findCharactersByTypeAndStep(pookieType, step).get(0);
        System.out.println('a');
        System.out.println(character);
        catalog = CharacterCatalog.builder()
                .userAccount(userAccount)
                .character(character)
                .isRepresent(false)
                .build();
        characterCatalogRepository.save(catalog);
    }

    @Transactional(rollbackFor = Exception.class)
    public UserCharacters feedMyPookie(Long userAccountId, int expFromItem) throws RuntimeException {
        // 대표 캐릭터 가져오기
        Characters repCharacter = getRepPookie(userAccountId);
        UserCharacters userCharacter = userCharactersRepository
                .findByUserAccountIdAndCharacterId(userAccountId, repCharacter.getId())
                .orElseThrow(() -> new RuntimeException("대표 캐릭터를 찾을 수 없습니다."));

        // 경험치 추가
        userCharacter.upExp(expFromItem);

        int currentStep = userCharacter.getCharacter().getStep();
        PookieType currentType = userCharacter.getCharacter().getType();
        int requiredExp = ExpThreshold.getRequiredExpForStep(currentStep);

        // Step별 기준치 도달 여부 확인
        if (userCharacter.getExp() >= requiredExp) {
            userCharacter.resetExp();

            List<Characters> candidates;

            if (currentStep == 1) {
                // Step 1 -> Step 2 : type 무관
                candidates = charactersRepository.findByStep(2);
                if (!candidates.isEmpty()) {
                    Characters nextChar = getRandomCharacter(candidates);
                    userCharacter.changeCharacter(nextChar);
                    setPookieCatalogIfNotExists(userCharacter.getUserAccount(), 2, nextChar.getType());
                }
            } else if (currentStep == 2) {
                // Step 2 -> Step 3 : 같은 type
                candidates = charactersRepository.findCharactersByTypeAndStep(currentType, 3);
                if (!candidates.isEmpty()) {
                    Characters nextChar = getRandomCharacter(candidates);
                    userCharacter.changeCharacter(nextChar);
                    setPookieCatalogIfNotExists(userCharacter.getUserAccount(), 3, nextChar.getType());
                }
            }
        }

        return userCharactersRepository.save(userCharacter);
    }

    private Characters getRandomCharacter(List<Characters> candidates) {
        Random random = new Random();
        return candidates.get(random.nextInt(candidates.size()));
    }

    private void setPookieCatalogIfNotExists(UserAccounts userAccount, int step, PookieType pookieType) {
        boolean exists = characterCatalogRepository
                .existsByUserAccountIdAndCharacterStepAndCharacterType(userAccount.getId(), step, pookieType);

        if (!exists) {
            Characters character = charactersRepository.findCharactersByTypeAndStep(pookieType, step).get(0);
            CharacterCatalog catalog = CharacterCatalog.builder()
                    .userAccount(userAccount)
                    .character(character)
                    .isRepresent(false)
                    .build();
            characterCatalogRepository.save(catalog);
        }
    }
}
