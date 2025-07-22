package com.ssafy.pookie.webrtc.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.livekit.server.*;
import livekit.LivekitModels;
import livekit.LivekitWebhook;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import retrofit2.Call;
import retrofit2.Response;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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

    private final String LIVEKIT_URL = "wss://i13a604.p.ssafy.io:443";

    private RoomServiceClient roomServiceClient;

    private final ObjectMapper objectMapper;

    public WebRtcController() {
        this.objectMapper = new ObjectMapper();
        initLiveKitController();
    }

    private void initLiveKitController() {
        try {
            this.roomServiceClient = RoomServiceClient.create(
                    LIVEKIT_URL.replace("ws://", "http")
                            .replace("wss://", "htpps"),
                    LIVEKIT_API_KEY,
                    LIVEKIT_API_SECRET
            );
            log.info("Success init livekit client");
        } catch(Exception e) {
            log.error("Failed to init livekit client : "+e.getMessage());
        }
    }
    /*
        TODO
           ✅1. 토큰 발급
           ✅2. Web Hook
            3. Broadcast
                3-1. Signal
     */
    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> createToken(@RequestBody Map<String, String> params) throws JsonProcessingException {
        String room = params.get("room");
        String name = params.get("name");
        // TODO security 설정 이후 교체
//        String sub = UserDetails.getUuid();
        String sub = "dummy"+name;
        String team = params.get("team");
        if (room == null || name == null || team == null) {
            log.error("room, name and team are required");
            return ResponseEntity.badRequest().body(Map.of("errorMessage", "room, name and team are required"));
        }

        // TODO 팀 정보 추가
        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(name);
        token.setIdentity(sub);
        token.setMetadata(new ObjectMapper().writeValueAsString(Map.of("team", team)));
        token.addGrants(new RoomJoin(true), new RoomName(room));

        log.info("Success token generate : "+name);
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

    // Message BroadCasting
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestBody Map<String, String> params) {
        try {
            String sid = params.get("sid");     // session id
            String room = params.get("room");   // room id
            String sub = params.get("sub");     // uuid
            String name = params.get("name");   // user name
            String team = params.get("team");   // user team
            String msg = params.get("msg");     // send message
            // [제시어 | 제시어]
            String type = params.get("type");   // message type

            if (sid == null || sid.isEmpty()) {
                log.error("sessionId is required");
                return ResponseEntity.badRequest().body("sessionId is required");
            }

            if (msg == null || msg.isEmpty()) {
                log.error("message is required");
                return ResponseEntity.badRequest().body("message is required");
            }

            if(team == null || team.isEmpty()) {
                log.error("team is required");
                return ResponseEntity.badRequest().body("team is required");
            }
            // LiveKit sendData API 사용
            boolean success = sendDataToRoom(sid, room, sub, name, team, type, msg);

            if (success) {
                log.info("Message broadcasted successfully via LiveKit");
                return ResponseEntity.ok("Message broadcasted successfully via LiveKit");
            } else {
                log.error("Failed to broadcast message");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to broadcast message");
            }

        } catch (Exception e) {
            log.error("Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    private boolean sendDataToRoom(String sid, String room, String sub, String name, String team, String type, String msg) {
        try {
            // 메시지 데이터 구성
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("type", type != null ? type : "chat");
            messageData.put("msg", msg);
            messageData.put("name", name);
            messageData.put("timestamp", LocalDateTime.now());

            // JSON을 바이트 배열로 변환
            String jsonMessage = objectMapper.writeValueAsString(messageData);
            byte[] data = jsonMessage.getBytes(StandardCharsets.UTF_8);

            // LiveKit에 데이터 전송
            Call<Void> call = roomServiceClient.sendData(
                    room,
                    data,
                    LivekitModels.DataPacket.Kind.RELIABLE,
                    List.of(sid),
                    List.of("user1234")
            );

            Response<Void> response = call.execute();

            log.info("Data sent successfully to room: " + room);
            return true;

        } catch (Exception e) {
            log.error("Error sending data to LiveKit room: " + e.getMessage());
            return false;
        }
    }
}
