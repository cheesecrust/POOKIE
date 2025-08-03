package com.ssafy.pookie.global.security.handler;

import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.service.OAuthUserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuthUserService oAuthUserService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        log.info("✅ OAuth2 로그인 성공!");

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = authToken.getAuthorizedClientRegistrationId(); // google / kakao

        log.info("✅ 로그인 제공자: {}", registrationId);

        LoginResponseDto loginResponse;

        switch (registrationId) {
            case "google":
                loginResponse = oAuthUserService.handleGoogleLogin(oAuth2User);
                break;
            case "kakao":
                loginResponse = oAuthUserService.handleKakaoLogin(oAuth2User);
                break;
            default:
                throw new IllegalStateException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }

        // Refresh Token을 HttpOnly + Secure 쿠키로 저장
        Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // HTTPS 환경에서만 전송
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일 (필요에 맞게 설정)
        response.addCookie(refreshTokenCookie);

        // Access Token은 프론트엔드로 redirect 시 쿼리 파라미터로 전달
        String redirectUrl = String.format(
                "https://i13a604.p.ssafy.io/oauth/callback?accessToken=%s&email=%s&nickname=%s",
                loginResponse.getAccessToken(),
                loginResponse.getEmail(),
                loginResponse.getNickname()
        );

        log.info("✅ 리다이렉트 URL: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    }
}