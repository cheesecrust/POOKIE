package com.ssafy.pookie.global.security.interceptor;

import com.ssafy.pookie.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
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
        String query = request.getURI().getQuery();
        if (query != null && query.startsWith("token=")) {
            String token = query.substring(6);

            if (jwtTokenProvider.validateToken(token)) {
                attributes.put("userAccountId", jwtTokenProvider.getUserIdFromToken(token));
                attributes.put("userEmail", jwtTokenProvider.getEmailFromToken(token));
                attributes.put("nickname", jwtTokenProvider.getNicknameFromToken(token));
                log.info("✅ WebSocket Handshake 토큰 검증 성공: {}", attributes.get("userEmail"));
                return true;
            } else {
                log.warn("❌ Handshake 토큰 만료 → 401 응답");
                return false;
            }
        }
        log.warn("❌ Handshake 실패: token 파라미터 없음");
        return false; // 인증 실패시 연결 거부
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {

    }
}