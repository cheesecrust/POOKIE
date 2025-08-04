package com.ssafy.pookie.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.service.OAuthUserService;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // JSON 형태로 응답
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(loginResponse));
    }
}