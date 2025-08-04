package com.ssafy.pookie.global.exception.handler;

import com.ssafy.pookie.global.exception.CustomException;
import com.ssafy.pookie.global.exception.dto.ExceptionDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ExceptionDto> handleCustomException(CustomException exception, HttpServletRequest request) {
        ExceptionDto response = new ExceptionDto(
                LocalDateTime.now(),
                exception.getErrorCode().getHttpStatus().value(),
                exception.getErrorCode().name(),
                exception.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(exception.getErrorCode().getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionDto> handleException(Exception exception, HttpServletRequest request) {
        ExceptionDto response = new ExceptionDto(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                exception.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
