package com.ssafy.pookie.game.user.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import lombok.Data;

@Data
public class UserStatusChangeDto {
    // User 가 Room 에서의 Ready 상태 변경을 위한 DTO
    private String roomId;
    private UserDto user;
    private String team;

    // 현 상태에 반대되는 Status 로 변경
    public boolean changeStatus(RoomStateDto room) {
        UserDto reqUser = null;
        for(UserDto tempUser : room.getUsers().get(team)) {
            if(tempUser.getUserId().equals(this.user.getUserId()) &&
            tempUser.getUserNickname().equals(this.user.getUserNickname())) {
                reqUser = tempUser;
            }
        }
        if(reqUser == null) return false;
        reqUser.setStatus(reqUser.getStatus() ==  UserDto.Status.READY ?
                UserDto.Status.NONE : UserDto.Status.READY);
        return true;
    }
}
