package com.ssafy.pookie.letter.dto;

import java.time.LocalDateTime;

public interface CombinedMessageProjection {
    Long getId();
    Long getReceiverId();
    String getReceiverNickname();
    Long getSenderId();
    String getSenderNickname();
    String getMessage();
    String getStatus();
    String getType();
    LocalDateTime getCreatedAt();
    Long getRequestId();
}
