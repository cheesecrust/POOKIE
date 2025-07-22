package com.ssafy.pookie.webrtc.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class WebRtcController {
    @Value("${livekit.api.key}")
    private String LIVEKIT_API_KEY;

    @Value("${livekit.api.secret}")
    private String LIVEKIT_API_SECRET;

    /*
        TODO
            1. 토큰 발급
            2. Web Hook
            3. Broadcast
                3-3. Signal
     */



}
