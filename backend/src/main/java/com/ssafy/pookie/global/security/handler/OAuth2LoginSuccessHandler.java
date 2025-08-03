package com.ssafy.pookie.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.service.OAuthUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

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

        // OAuthUserService를 통해 DB 저장/조회 및 JWT 발급
        LoginResponseDto loginResponse = oAuthUserService.handleGoogleLogin(oAuth2User);

        // JSON 형태로 응답
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(loginResponse));
    }
}
