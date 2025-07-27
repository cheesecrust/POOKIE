package com.ssafy.pookie.game.room.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class RoomMasterForcedRemovalDto {
    // 방장이 강퇴시킬 때 사용
    private String roomId;
    private String removeTargerId;        // 강퇴 대상자 ID
    private String removeTargetTeam;      // 강퇴 대상자 팀
    private UserDto roomMaster;
}
