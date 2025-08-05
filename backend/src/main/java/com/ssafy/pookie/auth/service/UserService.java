package com.ssafy.pookie.auth.service;

import com.ssafy.pookie.auth.dto.LoginRequestDto;
import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.dto.SignupRequestDto;
import com.ssafy.pookie.auth.dto.SignupResponseDto;
import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.model.base.Users;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.auth.repository.UsersRepository;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {

    private final UsersRepository usersRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CharacterService characterService;

    @Value("${oauth.kakao.logout-url}")
    private String kakaoLogoutUrl;

    @Value("${oauth.kakao.client-id}")
    private String kakaoClientId;

    @Value("${oauth.kakao.logout-redirect-uri}")
    private String kakaoLogoutRedirectUri;

    public SignupResponseDto signup(SignupRequestDto signupRequest) {
        // 이메일 중복 확인
        if (usersRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        // 닉네임 중복 확인
        if (userAccountsRepository.existsByNickname(signupRequest.getNickname())) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
        }

        // 사용자 생성
        Users user = Users.builder()
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .build();

        UserAccounts account = UserAccounts.builder()
                .user(user)
                .nickname(signupRequest.getNickname())
                .build();

        Users savedUser = usersRepository.save(user);
        UserAccounts savedAccount = userAccountsRepository.save(account);

        // 첫 푸키 지급 (UserCharacters + CharacterCatalog까지 통합)
        characterService.setUserPookie(savedAccount, PookieType.BASE);

        return SignupResponseDto.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .nickname(savedAccount.getNickname())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    public LoginResponseDto login(LoginRequestDto loginRequest) {
        try {
            // 사용자 정보 조회
            Users user = usersRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            UserAccounts userAccount = user.getUserAccount();

            log.info(user.getPassword() + " " + loginRequest.getPassword());
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new Exception("비밀번호가 일치하지 않습니다.");
            }

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(userAccount.getId(), user.getEmail(), userAccount.getNickname());
            String refreshToken = jwtTokenProvider.createRefreshToken(userAccount.getId());

            return LoginResponseDto.builder()
                    .userAccountId(user.getId())
                    .email(user.getEmail())
                    .nickname(userAccount.getNickname())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();
        } catch (Exception e) {
            log.error("로그인 실패: {}", e.getMessage());
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
    }

    public String logout(String token, HttpServletResponse response) {
        if (token == null) {
            throw new IllegalArgumentException("로그아웃할 토큰이 없습니다.");
        }

        String provider = jwtTokenProvider.getProviderFromToken(token);

        if ("local".equals(provider)) {
            logoutLocal(token, response);
            return null;
        } else {
            return logoutSocial(token, provider, response);
        }
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0); // 즉시 만료
        response.addCookie(cookie);
    }

    public void logoutLocal(String token, HttpServletResponse response) {
        if (token != null) {
            log.info("로컬 로그아웃 처리 완료");
            clearRefreshTokenCookie(response);
            // TODO: 추후 Redis 블랙리스트 등록
        }
    }

    public String logoutSocial(String token, String provider, HttpServletResponse response) {
        if (token != null) {
            log.info("소셜 로그아웃 처리: provider={}", provider);
            clearRefreshTokenCookie(response);
            // TODO: 추후 Redis 블랙리스트 등록

            if ("google".equals(provider)) {
                log.info("구글 로그아웃은 서버 토큰 무효화만 수행 (prompt=login으로 재인증 유도)");
                return null;
            } else if ("kakao".equals(provider)) {
                String logoutUrl = kakaoLogoutUrl
                        + "?client_id=" + kakaoClientId
                        + "&logout_redirect_uri=" + kakaoLogoutRedirectUri;
                log.info("카카오 로그아웃 URL 생성: {}", logoutUrl);
                return logoutUrl;
            }
        }
        return null;
    }

    public LoginResponseDto refreshToken(String refreshToken) {
        try {
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            Long userAccountId = jwtTokenProvider.getUserIdFromToken(refreshToken);
            String provider = jwtTokenProvider.getProviderFromToken(refreshToken);

            Users user = usersRepository.findById(userAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            UserAccounts userAccount = user.getUserAccount();

            String newAccessToken;
            String newRefreshToken;

            if ("local".equals(provider)) {
                newAccessToken = jwtTokenProvider.createAccessToken(userAccountId, user.getEmail(), userAccount.getNickname());
                newRefreshToken = jwtTokenProvider.createRefreshToken(userAccountId);
            } else {
                newAccessToken = jwtTokenProvider.createSocialAccessToken(userAccountId, user.getEmail(), userAccount.getNickname(), provider);
                newRefreshToken = jwtTokenProvider.createSocialRefreshToken(userAccountId, provider);
            }

            return LoginResponseDto.builder()
                    .userAccountId(user.getId())
                    .email(user.getEmail())
                    .nickname(userAccount.getNickname())
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .build();
        } catch (Exception e) {
            log.error("토큰 갱신 실패: {}", e.getMessage());
            throw new IllegalArgumentException("토큰 갱신에 실패했습니다.");
        }
    }

    @Transactional(readOnly = true)
    public boolean isEmailDuplicate(String email) {
        return usersRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public SignupResponseDto getUserInfo(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        UserAccounts userAccount = user.getUserAccount();

        return SignupResponseDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(userAccount.getNickname())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public Page<UserAccounts> getUsers(String search, Pageable pageable) {
        return userAccountsRepository.findByNicknameContains(search, pageable);
    }
}

