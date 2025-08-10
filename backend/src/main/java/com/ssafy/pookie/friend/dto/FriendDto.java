package com.ssafy.pookie.friend.dto;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.character.dto.RepCharacterResponseDto;
import com.ssafy.pookie.friend.model.Friends;
import com.ssafy.pookie.friend.model.Status;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendDto {
    private Long userId;
    private String nickname;
    private Status status;
    private RepCharacterResponseDto repCharacter;

    public static FriendDto from(UserAccounts user, Status status) {
        return FriendDto.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .status(status)
                .build();
    }

    public static FriendDto from(Friends friends, Status status, Long userId, RepCharacterResponseDto repCharacter) {
        UserAccounts user1 = friends.getUser1();
        UserAccounts user2 = friends.getUser2();
        Long friendId =
                user1.getId().equals(userId) ? user2.getId() : user1.getId();
        String friendNickname =
                user1.getId().equals(userId) ? user2.getNickname() : user1.getNickname();

        return FriendDto.builder()
                .userId(friendId)
                .nickname(friendNickname)
                .status(status)
                .repCharacter(repCharacter)
                .build();
    }
}
