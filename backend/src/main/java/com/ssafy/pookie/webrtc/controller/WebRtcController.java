package com.ssafy.pookie.webrtc.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.livekit.server.*;
import livekit.LivekitWebhook;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*")
@RequestMapping("/rtc")
@RestController
@Slf4j
public class WebRtcController {
    @Value("${livekit.api.key}")
    private String LIVEKIT_API_KEY;

    @Value("${livekit.api.secret}")
    private String LIVEKIT_API_SECRET;

    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> createToken(@RequestBody Map<String, String> params) throws JsonProcessingException {
        String room = params.get("room");
        String name = params.get("name");

        if (room == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("errorMessage", "room, name and team are required"));
        }

        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(name);
        token.setIdentity(name);
        token.addGrants(new RoomJoin(true), new RoomName(room));
        return ResponseEntity.ok(Map.of("token", token.toJwt()));
    }

    // Content-type 명시 필요 -> Content-type: application/webhook+json
    @PostMapping(value="/livekit/webhook")
    public ResponseEntity<String> receiveWebhook(@RequestHeader("Authorization") String authHeader, @RequestBody String body) {
        WebhookReceiver webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        try {
            LivekitWebhook.WebhookEvent event = webhookReceiver.receive(body, authHeader);
            log.info("LiveKit Webhook: " + event.toString());
        } catch (Exception e) {
            log.error("Error validating webhook event: " + e.getMessage());
        }
        return ResponseEntity.ok("ok");
    }
}
