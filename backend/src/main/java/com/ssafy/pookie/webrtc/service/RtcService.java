package com.ssafy.pookie.webrtc.service;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RtcService {
    @Value("${livekit.api.key}")
    private String LIVEKIT_API_KEY;

    @Value("${livekit.api.secret}")
    private String LIVEKIT_API_SECRET;

    public String makeToken(String userName, Long userId, String roomId) {
        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(userName);
        token.setIdentity(userId.toString());
        token.addGrants(new RoomJoin(true), new RoomName(roomId));
        return token.toJwt();
    }

}
