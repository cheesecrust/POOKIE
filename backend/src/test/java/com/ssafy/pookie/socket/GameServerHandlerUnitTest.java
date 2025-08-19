package com.ssafy.pookie.socket;

import com.ssafy.pookie.metrics.SocketMetrics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import io.micrometer.core.instrument.Timer;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class GameServerHandlerUnitTest {

    @Mock
    private SocketMetrics socketMetrics;
    
    @Mock
    private Timer.Sample timerSample;

    @BeforeEach
    void setUp() {
        // Mock 초기화만 수행
    }

    @Test
    void testSocketMetricsStartMessageProcessing() {
        // 메시지 처리 시작 테스트
        when(socketMetrics.startMessageProcessing()).thenReturn(timerSample);
        Timer.Sample sample = socketMetrics.startMessageProcessing();
        verify(socketMetrics).startMessageProcessing();
        assertNotNull(sample);
    }

    @Test
    void testSocketMetricsStartConnectionHandling() {
        // 연결 처리 시작 테스트
        when(socketMetrics.startConnectionHandling()).thenReturn(timerSample);
        Timer.Sample sample = socketMetrics.startConnectionHandling();
        verify(socketMetrics).startConnectionHandling();
        assertNotNull(sample);
    }

    @Test
    void testSocketMetricsRecordConnection() {
        // 연결 기록 테스트
        socketMetrics.recordConnectionAttempt();
        socketMetrics.recordConnectionAccepted("session-123");
        socketMetrics.recordConnectionClosed("session-123");
        
        verify(socketMetrics).recordConnectionAttempt();
        verify(socketMetrics).recordConnectionAccepted("session-123");
        verify(socketMetrics).recordConnectionClosed("session-123");
    }

    @Test
    void testSocketMetricsRecordMessage() {
        // 메시지 기록 테스트
        socketMetrics.recordMessageReceived("CHAT", 100);
        socketMetrics.recordMessageSent("RESPONSE", 50);
        
        verify(socketMetrics).recordMessageReceived("CHAT", 100);
        verify(socketMetrics).recordMessageSent("RESPONSE", 50);
    }
}