package com.ssafy.pookie.game.user.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

@Data
public class UserTeamChangeRequestDto {
    private String roomId;
    private UserDto user;
    private UserDto.Team curTeam;   // 현재 팀에 따라 팀을 변경

    // 현재 팀의 반대되는 팀으로 넘겨준다.
    public Boolean changeTeam(RoomStateDto room) {
        UserDto tempUser = null;
        // 현재 유저를 찾아온다.
        for(UserDto reqUser : room.getUsers().get(this.curTeam.toString())) {
            if(reqUser.getUserId().equals(user.getUserId()) &&
                    reqUser.getUserNickname().equals(user.getUserNickname())) {
                tempUser = reqUser;
                break;
            }
        }
        if(tempUser == null || tempUser.getTeam() != curTeam) return false;

        if(tempUser.getTeam() == UserDto.Team.RED) {
            tempUser.setTeam(UserDto.Team.BLUE);
            room.getUsers().get(UserDto.Team.RED.toString()).remove(tempUser);
            room.getUsers().get(UserDto.Team.BLUE.toString()).add(tempUser);
        } else if(tempUser.getTeam() == UserDto.Team.BLUE) {
            tempUser.setTeam(UserDto.Team.RED);
            room.getUsers().get(UserDto.Team.BLUE.toString()).remove(tempUser);
            room.getUsers().get(UserDto.Team.RED.toString()).add(tempUser);
        }

        return true;
    }
}
