package com.ssafy.pookie.global.security.interceptor;

import com.ssafy.pookie.common.security.JwtTokenProvider;
import com.ssafy.pookie.global.security.user.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

        // 이 시점에서는 SecurityContext 접근 가능
        String token = request.getURI().getQuery();
        if (token != null && token.startsWith("token=")) {
            String actualToken = token.substring(6); // "token=" 제거

            // 토큰 검증 로직
            if (jwtTokenProvider.validateToken(actualToken)) {
                attributes.put("userAccountId", jwtTokenProvider.getUserIdFromToken(actualToken));
                attributes.put("userEmail", jwtTokenProvider.getEmailFromToken(actualToken));
                attributes.put("nickname", jwtTokenProvider.getNicknameFromToken(actualToken));
                return true;
            }
        }

        return false; // 인증 실패시 연결 거부
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {

    }
}