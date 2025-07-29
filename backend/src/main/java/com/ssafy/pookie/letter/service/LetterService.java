package com.ssafy.pookie.letter.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.letter.dto.LetterRequestDto;
import com.ssafy.pookie.letter.dto.LetterResponseDto;
import com.ssafy.pookie.letter.model.LetterStatus;
import com.ssafy.pookie.letter.model.Letters;
import com.ssafy.pookie.letter.repository.LettersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LetterService {

    private final LettersRepository lettersRepository;
    private final UserAccountsRepository userAccountsRepository;

    public LetterResponseDto sendLetter(Long userAccountId, LetterRequestDto letterRequest) {
        log.info(userAccountId.toString() + " " + letterRequest.getReceiverId().toString());
        UserAccounts sender = userAccountsRepository.findById(userAccountId).get();
        UserAccounts receiver = userAccountsRepository.findById(letterRequest.getReceiverId()).get();
        Letters letter = Letters.builder()
                .receiver(receiver)
                .sender(sender)
                .message(letterRequest.getMessage())
                .status(LetterStatus.NOT_READ)
                .build();
        return LetterResponseDto.of(lettersRepository.save(letter));
    }

    public List<LetterResponseDto> getReceivedLetters(Long userAccountId) {
        List<Letters> letters =  lettersRepository.findLettersByReceiverId(userAccountId);
        return letters.stream().map(LetterResponseDto::of)
                .collect(Collectors.toList());
    }

    public List<LetterResponseDto> getSentLetters(Long userAccountId) {
        List<Letters> letters = lettersRepository.findLettersBySenderId(userAccountId);
        return letters.stream().map(LetterResponseDto::of)
                .collect(Collectors.toList());
    }

    public LetterResponseDto getLetterDetail(Long userAccountId, Long letterId) throws Exception {
        Letters letter = lettersRepository.findByLetterIdAndUserInvolved(letterId, userAccountId)
                .orElseThrow(() -> new Exception("letter not found"));
        if (letter.getReceiver().getId().equals(userAccountId)) {
            letter.updateStatus(LetterStatus.READ);
            lettersRepository.save(letter);
        }
        return LetterResponseDto.of(letter);
    }

    public boolean deleteLetters(Long userAccountId, Long letterId) {
        int deletedRows = lettersRepository.deleteByLetterIdAndUserInvolved(letterId, userAccountId);
        return deletedRows > 0;
    }
}
