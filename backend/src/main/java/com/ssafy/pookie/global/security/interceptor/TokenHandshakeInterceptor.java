package com.ssafy.pookie.global.security.interceptor;

import com.ssafy.pookie.global.security.user.CustomUserDetails;
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
@Slf4j
public class TokenHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

        // 이 시점에서는 SecurityContext 접근 가능
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        log.info("before handshake {}", authentication);

        if (authentication != null && authentication.isAuthenticated()) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            log.info("beforeHandshake {}", userDetails.getUsername());

            // SecurityContext의 정보를 WebSocket 세션으로 복사
            attributes.put("userAccountId", userDetails.getUserAccountId());
            attributes.put("userEmail", userDetails.getEmail());
            attributes.put("nickname", userDetails.getNickname());

            return true;
        }

        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {

    }
}