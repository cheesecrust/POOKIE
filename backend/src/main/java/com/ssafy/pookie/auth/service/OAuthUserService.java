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

    public LoginResponseDto handleGoogleLogin(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String socialId = oAuth2User.getAttribute("sub");
        String nickname = oAuth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            throw new IllegalStateException("구글 로그인에서 이메일 정보를 가져오지 못했습니다.");
        }

        if (nickname == null || nickname.isBlank()) {
            nickname = email.contains("@") ? email.split("@")[0] : "googleUser";
        }

        // Users 조회
        Users user = usersRepository.findByEmail(email).orElse(null);
        UserAccounts userAccount;

        if (user == null) {
            // 신규 가입 (일반 회원가입과 동일 로직)
            user = Users.builder()
                    .email(email)
                    .password(passwordEncoder.encode("test1234")) // 임의 비밀번호
                    .socialId(socialId)
                    .build();

            UserAccounts account = UserAccounts.builder()
                    .user(user)
                    .nickname(nickname)
                    .build();

            Users savedUser = usersRepository.save(user);
            UserAccounts savedAccount = userAccountsRepository.save(account);

            // 기본 캐릭터 지급
            Characters character = characterService.setUserPookie(savedAccount, PookieType.BASE);
            characterService.setPookieCatalog(savedAccount, character.getStep(), character.getType());
            characterService.changeRepPookie(savedAccount, character.getType(), character.getStep());

            user = savedUser;
            userAccount = savedAccount;
        } else {
            // 기존 유저면 바로 연결
            userAccount = user.getUserAccount();
            if (userAccount == null) {
                throw new IllegalStateException("기존 사용자 계정(UserAccounts)이 존재하지 않습니다.");
            }
        }

        // JWT 발급
        String accessToken = jwtTokenProvider.createAccessToken(
                userAccount.getId(),
                user.getEmail(),
                userAccount.getNickname()
        );
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

