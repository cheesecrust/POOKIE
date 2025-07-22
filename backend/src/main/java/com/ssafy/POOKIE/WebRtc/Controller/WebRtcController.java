package com.ssafy.pookie.webrtc.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
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

    private final String LIVEKIT_URL = "";

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
            1. 토큰 발급
            2. Web Hook
            3. Broadcast
                3-1. Signal
     */
    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> createToken(@RequestBody Map<String, String> params) throws JsonProcessingException {
        String roomName = params.get("roomName");
        String participantName = params.get("participantName");
        // TODO security 설정 이후 교체
//        String uuid = UserDetails.getUuid();
        String uuid = "dummy";
        String teamInfo = params.get("teamInfo");

        if (roomName == null || participantName == null) {
            log.error("roomName and participantName are required");
            return ResponseEntity.badRequest().body(Map.of("errorMessage", "roomName and participantName are required"));
        }

        // TODO 팀 정보 추가
        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(participantName);
        token.setIdentity(uuid);
        token.setMetadata(new ObjectMapper().writeValueAsString(Map.of("teamInfo", teamInfo)));
        token.addGrants(new RoomJoin(true), new RoomName(roomName));

        log.info("Success token generate : "+participantName);
        return ResponseEntity.ok(Map.of("token", token.toJwt()));
    }


}
