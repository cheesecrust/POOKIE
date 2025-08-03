package com.ssafy.pookie.auth.service;

import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.model.base.Users;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.auth.repository.UsersRepository;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OAuthUserService {

    private final UsersRepository usersRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final CharacterService characterService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 구글 로그인 처리
     */
    public LoginResponseDto handleGoogleLogin(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String socialId = oAuth2User.getAttribute("sub");
        String nickname = oAuth2User.getAttribute("name");

        return handleLoginCommon(email, nickname, socialId, PookieType.BASE);
    }

    /**
     * 카카오 로그인 처리
     */
    public LoginResponseDto handleKakaoLogin(OAuth2User oAuth2User) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
        if (kakaoAccount == null) {
            throw new IllegalStateException("카카오 계정 정보를 가져오지 못했습니다.");
        }

        String email = (String) kakaoAccount.get("email");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        String nickname = profile != null ? (String) profile.get("nickname") : null;
        String socialId = oAuth2User.getAttribute("id").toString();

        return handleLoginCommon(email, nickname, socialId, PookieType.BASE);
    }

    /**
     * 공통 로그인/회원가입 처리
     */
    private LoginResponseDto handleLoginCommon(String email, String nickname, String socialId, PookieType defaultType) {
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("소셜 로그인에서 이메일 정보를 가져오지 못했습니다.");
        }

        if (nickname == null || nickname.isBlank()) {
            nickname = email.contains("@") ? email.split("@")[0] : "socialUser";
        }

        Users user = usersRepository.findByEmail(email).orElse(null);
        UserAccounts userAccount;
        if (user == null) {
            log.info("신규 소셜 회원가입 진행: email={}", email);

            user = Users.builder()
                    .email(email)
                    .password(passwordEncoder.encode("test1234")) // 소셜 로그인용 임시 비번
                    .socialId(socialId)
                    .build();

            UserAccounts account = UserAccounts.builder()
                    .user(user)
                    .nickname(nickname)
                    .build();

            Users savedUser = usersRepository.save(user);
            UserAccounts savedAccount = userAccountsRepository.save(account);

            // 기본 캐릭터 지급
            Characters character = characterService.setUserPookie(savedAccount, defaultType);
            characterService.setPookieCatalog(savedAccount, character.getStep(), character.getType());
            characterService.changeRepPookie(savedAccount, character.getType(), character.getStep());

            user = savedUser;
            userAccount = savedAccount;
        } else {
            userAccount = user.getUserAccount();
        }
        // JWT 발급
        String accessToken = jwtTokenProvider.createAccessToken(userAccount.getId(), user.getEmail(), userAccount.getNickname());
        String refreshToken = jwtTokenProvider.createRefreshToken(userAccount.getId());

        return LoginResponseDto.builder()
                .userAccountId(userAccount.getId())
                .email(user.getEmail())
                .nickname(userAccount.getNickname())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}