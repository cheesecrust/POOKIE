package com.ssafy.pookie.socket.config;

import com.ssafy.pookie.game.server.handler.GameServerHandler;
import com.ssafy.pookie.global.security.interceptor.TokenHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class SocketConfig implements WebSocketConfigurer {

    private final TokenHandshakeInterceptor tokenHandshakeInterceptor;
    private final GameServerHandler gameServerHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gameServerHandler, "game")
                .setAllowedOrigins("*")
                .addInterceptors(tokenHandshakeInterceptor);;
    }
}
