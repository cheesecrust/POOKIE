package com.ssafy.pookie.socket;

import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import java.net.URI;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class SpringTestWebSocketClient implements WebSocketHandler {
    
    private final BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
    private final CountDownLatch connectionLatch = new CountDownLatch(1);
    private final CountDownLatch closeLatch = new CountDownLatch(1);
    private volatile boolean connected = false;
    private volatile String lastError = null;
    private WebSocketSession session = null;
    private final StandardWebSocketClient client;
    private final URI uri;

    public SpringTestWebSocketClient(URI serverUri) {
        this.uri = serverUri;
        this.client = new StandardWebSocketClient();
    }

    public boolean connectBlocking() throws InterruptedException {
        try {
            WebSocketSession session = client.execute(this, null, uri).get(10, TimeUnit.SECONDS);
            this.session = session;
            return connectionLatch.await(10, TimeUnit.SECONDS) && connected;
        } catch (Exception e) {
            System.err.println("Connection failed: " + e.getMessage());
            e.printStackTrace();
            lastError = e.getMessage();
            return false;
        }
    }

    public boolean closeBlocking() throws InterruptedException {
        if (session != null && session.isOpen()) {
            try {
                session.close();
                return closeLatch.await(5, TimeUnit.SECONDS);
            } catch (Exception e) {
                System.err.println("Close failed: " + e.getMessage());
                return false;
            }
        }
        return true;
    }

    public void send(String message) {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (Exception e) {
                System.err.println("Send failed: " + e.getMessage());
            }
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket connection established: " + session.getId());
        this.session = session;
        connected = true;
        connectionLatch.countDown();
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        if (message instanceof TextMessage) {
            String payload = ((TextMessage) message).getPayload();
            System.out.println("Message received: " + payload);
            receivedMessages.offer(payload);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket transport error: " + exception.getMessage());
        lastError = exception.getMessage();
        connected = false;
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        System.out.println("WebSocket connection closed: " + closeStatus);
        connected = false;
        closeLatch.countDown();
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    public BlockingQueue<String> getReceivedMessages() {
        return receivedMessages;
    }

    public boolean waitForConnection(int timeoutSeconds) throws InterruptedException {
        return connectionLatch.await(timeoutSeconds, TimeUnit.SECONDS);
    }

    public boolean waitForMessage(int timeoutSeconds) throws InterruptedException {
        long startTime = System.currentTimeMillis();
        while (receivedMessages.isEmpty() && 
               (System.currentTimeMillis() - startTime) < (timeoutSeconds * 1000)) {
            Thread.sleep(100);
        }
        return !receivedMessages.isEmpty();
    }

    public String getLastError() {
        return lastError;
    }

    public boolean isConnected() {
        return connected;
    }

    public boolean isOpen() {
        return session != null && session.isOpen() && connected;
    }
}