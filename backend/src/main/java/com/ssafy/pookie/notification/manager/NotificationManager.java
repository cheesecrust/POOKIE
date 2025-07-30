package com.ssafy.pookie.notification.manager;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationManager {

    /**
     * (key, value) = (userId, notification cnt)
     */
    private final ConcurrentHashMap<Long, Long> notificationMap = new ConcurrentHashMap<>();

    /**
     * 알람이 몇개가 쌓였는지 알려줍니다.
     */
    public long getNotification(Long userAccountId) {
        if (notificationMap.get(userAccountId) == null) return 0;
        return notificationMap.get(userAccountId);
    }

    /**
     * 유저가 알림을 본 경우 호출하여 쌓아 놓은 알림을 없앱니다.
     */
    public boolean removeNotification(Long userAccountId) {
        notificationMap.remove(userAccountId);
        return notificationMap.get(userAccountId) != null;
    }

    /**
     * 오프라인 이어서 알림을 증가시켜야 할 경우 userId가 들고 있는 cnt를 증가시킵니다.
     */
    public long stackNotificationCnt(Long userAccountId) {
        return notificationMap.merge(userAccountId, 1L, Long::sum);
    }

    /**
     * 알림을 하나씩 줄입니다.
     * 이떄는 userId 가 없는 경우 오류이다.
     */
    public long discountNotificationCnt(Long userAccountId) {
        Long result = notificationMap.computeIfPresent(userAccountId, (k, v) -> v > 0 ? v - 1 : 0);
        return result != null ? result : 0L;
    }
}
