package com.ssafy.pookie.global.security.filter;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserAccountsRepository userAccountsRepository;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. 요청에서 JWT 토큰 추출
            String token = extractTokenFromRequest(request);

            // 2. 토큰이 있고 유효한 경우 인증 처리
            if (StringUtils.hasText(token)) {
                if (jwtTokenProvider.validateToken(token)) {
                    // 토큰에서 사용자 정보 추출하여 CustomUserDetails 생성
                    setAuthentication(request, token);
                } else {
                    log.warn("유효하지 않은 JWT 토큰: {}", request.getRequestURI());
                }
            }

        } catch (Exception e) {
            log.error("JWT 인증 처리 중 오류 발생: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            log.info(bearerToken.substring(BEARER_PREFIX.length()));
            return bearerToken.substring(BEARER_PREFIX.length());
        }

        return null;
    }

    private void setAuthentication(HttpServletRequest request, String token) {
        try {
            // 토큰에서 사용자 정보 추출
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(token);
            String email = jwtTokenProvider.getEmailFromToken(token);

            UserAccounts userAccount = userAccountsRepository.findById(userAccountId)
                    .orElseThrow(() -> new RuntimeException("잘못된 user account ID"));

            String nickname = userAccount.getNickname();
            String role = "USER"; // TODO: DB에서 조회

            // CustomUserDetails 생성
            CustomUserDetails userDetails = new CustomUserDetails(userAccountId, email, nickname, role);

            // 인증 객체 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,  // Principal로 CustomUserDetails 설정
                            null,
                            userDetails.getAuthorities()
                    );

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // SecurityContext에 인증 정보 저장
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT 인증 성공: userId={}, email={}", userAccountId, email);

        } catch (Exception e) {
            log.error("JWT 인증 객체 생성 실패: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        String[] excludePaths = {
                "/api/auth/",
                "/api/public/",
                "/health",
                "/actuator/",
                "/swagger-ui/",
                "/v3/api-docs/",
                "/error"
        };

        return Arrays.stream(excludePaths)
                .anyMatch(path::startsWith);
    }
}
