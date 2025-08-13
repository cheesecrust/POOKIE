package com.ssafy.pookie.notification.service;

import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.LobbyUserDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.notification.manager.NotificationManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final OnlinePlayerManager onlinePlayerManager;
    private final NotificationManager notificationManager;

    /**
     * 쪽지나 친구 요청 시 이벤트
     */
    public void sendRequestEvent(Long receiverAccountId) throws IOException {
        LobbyUserDto receiverUser = onlinePlayerManager.getMemberInLobby(receiverAccountId);
        long notificationCnt = notificationManager.stackNotificationCnt(receiverAccountId);
        // 유저가 오프라인인 경우 알림을 쌓기만 합니다.
        if (receiverUser == null) {
            return;
        }
        // 온라인인 경우는 쌓은 후에 보냅니다.
        sendNotification(receiverUser.getUser(), notificationCnt);
    }

    /**
     * 로그인 시 이벤트
     * 쌓인 알람이 있는지 확인 후 보냅니다.
     */
    public void loginEvent(UserDto user) throws IOException {
        long notificationCnt = notificationManager.getNotification(user.getUserAccountId());
        if (notificationCnt > 0) {
            sendNotification(user, notificationCnt);
        }
    }

    /**
     * 알람 읽었을때의 이벤트
     * 깎거나 없앤 후의 결과 값을 보냅니다.
     */
    public void readEvent(UserDto user) throws IOException {
        readNotification(user);
        sendNotification(user, notificationManager.getNotification(user.getUserAccountId()));
    }

    /**
     * 읽은 경우 cnt를 하나씩 깎거나 없에기
     */
    public void readNotification(UserDto user) {
        notificationManager.discountNotificationCnt(user.getUserAccountId());
    }

    /**
     * 알림 보내주기
     */
    public void sendNotification(UserDto user, long notificationCnt) throws IOException {
        onlinePlayerManager.sendToMessageUser(user.getSession(), Map.of(
                "data", Map.of(
                        "type", "NOTIFICATION",
                        "notificationCnt", notificationCnt
                )
        ));
    }
}
