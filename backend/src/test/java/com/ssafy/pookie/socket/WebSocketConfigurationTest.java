package com.ssafy.pookie.socket;

import com.ssafy.pookie.socket.config.SocketConfig;
import com.ssafy.pookie.game.server.handler.GameServerHandler;
import com.ssafy.pookie.global.security.interceptor.TokenHandshakeInterceptor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class WebSocketConfigurationTest {

    @Mock
    private TokenHandshakeInterceptor tokenHandshakeInterceptor;
    
    @Mock
    private GameServerHandler gameServerHandler;
    
    @Mock
    private WebSocketHandlerRegistry registry;
    
    @Mock
    private org.springframework.web.socket.config.annotation.WebSocketHandlerRegistration registration;

    @Test
    void testSocketConfigCreation() {
        // SocketConfig 생성 테스트
        SocketConfig socketConfig = new SocketConfig(tokenHandshakeInterceptor, gameServerHandler);
        
        assertNotNull(socketConfig, "SocketConfig should be created successfully");
    }

    @Test
    void testWebSocketHandlerRegistration() {
        // WebSocket 핸들러 등록 테스트
        when(registry.addHandler(gameServerHandler, "game")).thenReturn(registration);
        when(registration.setAllowedOrigins("*")).thenReturn(registration);
        when(registration.addInterceptors(tokenHandshakeInterceptor)).thenReturn(registration);
        
        SocketConfig socketConfig = new SocketConfig(tokenHandshakeInterceptor, gameServerHandler);
        socketConfig.registerWebSocketHandlers(registry);
        
        // 검증
        verify(registry).addHandler(gameServerHandler, "game");
        verify(registration).setAllowedOrigins("*");
        verify(registration).addInterceptors(tokenHandshakeInterceptor);
    }

    @Test
    void testHandlerAndInterceptorNotNull() {
        // 핸들러와 인터셉터가 null이 아닌지 확인
        assertNotNull(gameServerHandler, "GameServerHandler should not be null");
        assertNotNull(tokenHandshakeInterceptor, "TokenHandshakeInterceptor should not be null");
        
        SocketConfig socketConfig = new SocketConfig(tokenHandshakeInterceptor, gameServerHandler);
        assertNotNull(socketConfig, "SocketConfig should handle non-null dependencies");
    }

    @Test
    void testWebSocketEndpointPath() {
        // WebSocket 엔드포인트 경로 테스트
        String expectedPath = "game";
        
        when(registry.addHandler(any(), eq(expectedPath))).thenReturn(registration);
        when(registration.setAllowedOrigins(anyString())).thenReturn(registration);
        when(registration.addInterceptors(any())).thenReturn(registration);
        
        SocketConfig socketConfig = new SocketConfig(tokenHandshakeInterceptor, gameServerHandler);
        socketConfig.registerWebSocketHandlers(registry);
        
        verify(registry).addHandler(gameServerHandler, expectedPath);
    }
}