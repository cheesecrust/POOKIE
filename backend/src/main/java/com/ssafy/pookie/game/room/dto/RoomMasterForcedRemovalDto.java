package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class RoomMasterForcedRemovalDto {
    // 방장이 강퇴시킬 때 사용
    private String roomId;
    private Long removeTargetId;        // 강퇴 대상자 ID
    private String removeTargetNickname;
    private UserDto.Team removeTargetTeam;      // 강퇴 대상자 팀
    private UserDto roomMaster;

    public UserDto findRemoveTarget(RoomStateDto room) {
       return room.getUsers().get(this.removeTargetTeam.toString())
               .stream().filter((user) ->
                    user.getUserAccountId().equals(this.removeTargetId)
                           && user.getUserNickname().equals(this.removeTargetNickname)
               ).findAny().orElse(null);
    }
}
