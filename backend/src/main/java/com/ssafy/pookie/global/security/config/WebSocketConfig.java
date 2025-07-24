package com.ssafy.pookie.global.security.config;

import com.ssafy.pookie.game.server.handler.GameServerHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final GameServerHandler gameServerHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gameServerHandler, "/ws/*")
                .setAllowedOrigins("")  // 또는 특정 도메인
                .withSockJS();  // SockJS 사용하는 경우
    }
}
