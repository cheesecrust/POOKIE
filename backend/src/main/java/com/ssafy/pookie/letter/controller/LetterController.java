package com.ssafy.pookie.letter.controller;

import com.ssafy.pookie.common.request.ApiRequest;
import com.ssafy.pookie.letter.dto.LetterRequestDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController("/letter")
public class LetterController {

    @GetMapping("/received")
    public void getReceivedLetter(@AuthenticationPrincipal UserDetails userDetails) {}

    @GetMapping("/sent")
    public void getSentLetter(@AuthenticationPrincipal UserDetails userDetails) {}

    @GetMapping("/{letterId}/detail")
    public void getLetterDetail(
            @PathVariable Long letterId,
            @AuthenticationPrincipal UserDetails userDetails) {

    }

    @DeleteMapping
    public void deleteLetter(@AuthenticationPrincipal UserDetails userDetails) {}

    @PostMapping
    public void sendLetter(
            @RequestBody LetterRequestDto letterRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

    }
}
