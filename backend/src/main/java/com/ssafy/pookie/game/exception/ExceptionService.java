package com.ssafy.pookie.game.exception;

import com.ssafy.pookie.game.exception.room.RoomExceptionService;
import com.ssafy.pookie.game.room.dto.RoomStateDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExceptionService {
    private final RoomExceptionService exceptionService;

    public void handleMoveToNewRoom(RoomStateDto room) throws IOException {
        exceptionService.moveToNewRoom(room);
    }
}
