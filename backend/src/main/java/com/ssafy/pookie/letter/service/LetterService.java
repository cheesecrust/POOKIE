package com.ssafy.pookie.letter.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.game.server.manager.OnlinePlayerManager;
import com.ssafy.pookie.game.user.dto.UserDto;
import com.ssafy.pookie.letter.dto.CombinedMessageDto;
import com.ssafy.pookie.letter.dto.CombinedMessageProjection;
import com.ssafy.pookie.letter.dto.LetterRequestDto;
import com.ssafy.pookie.letter.dto.LetterResponseDto;
import com.ssafy.pookie.letter.model.LetterStatus;
import com.ssafy.pookie.letter.model.Letters;
import com.ssafy.pookie.letter.repository.CombinedRepository;
import com.ssafy.pookie.letter.repository.LettersRepository;
import com.ssafy.pookie.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LetterService {

    private final LettersRepository lettersRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final CombinedRepository combinedRepository;
    private final NotificationService notificationService;
    private final OnlinePlayerManager onlinePlayerManager;

    public LetterResponseDto sendLetter(Long userAccountId, LetterRequestDto letterRequest) {
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

    public Page<CombinedMessageDto> getSentLetters(Long userAccountId, Pageable pageable) {
        // 1. UNION 쿼리로 정확한 페이징
        List<CombinedMessageProjection> projections = combinedRepository
                .findSentMessages(
                        userAccountId,
                        pageable.getPageSize(),
                        (int) pageable.getOffset()
                );
        // 2. DTO 변환
        List<CombinedMessageDto> content = projections.stream()
                .map(CombinedMessageDto::from)
                .collect(Collectors.toList());

        // 3. 전체 개수 조회
        long totalElements = combinedRepository.countSentCombinedMessages(userAccountId);

        return new PageImpl<>(content, pageable, totalElements);
    }

    public Page<CombinedMessageDto> getReceivedLetters(Long userAccountId, Pageable pageable) {
        // 1. UNION 쿼리로 정확한 페이징
        List<CombinedMessageProjection> projections = combinedRepository
                .findCombinedMessages(
                        userAccountId,
                        pageable.getPageSize(),
                        (int) pageable.getOffset()
                );
        // 2. DTO 변환
        List<CombinedMessageDto> content = projections.stream()
                .map(CombinedMessageDto::from)
                .collect(Collectors.toList());

        // 3. 전체 개수 조회
        long totalElements = combinedRepository.countReceivedCombinedMessages(userAccountId);

        return new PageImpl<>(content, pageable, totalElements);
    }

    public LetterResponseDto getLetterDetail(Long userAccountId, Long letterId) throws Exception {
        Letters letter = lettersRepository.findByLetterIdAndUserInvolved(letterId, userAccountId)
                .orElseThrow(() -> new Exception("letter not found"));
        if (letter.getReceiver().getId().equals(userAccountId)) {
            throw new Exception("receiver and user is not match.");
        }
        if (letter.getStatus().equals(LetterStatus.NOT_READ)) {
            letter.updateStatus(LetterStatus.READ);
            lettersRepository.save(letter);
            UserDto user = onlinePlayerManager.getMemberInLobby(userAccountId).getUser();
            notificationService.readEvent(user);
        }
        return LetterResponseDto.of(letter);
    }

    public boolean deleteLetters(Long userAccountId, Long letterId) {
        int deletedRows = lettersRepository.deleteByLetterIdAndUserInvolved(letterId, userAccountId);
        return deletedRows > 0;
    }

    public boolean reportLetters(Long userAccountId, Long letterId) throws Exception {
        Letters letters = lettersRepository.findByLetterIdAndUserInvolved(userAccountId, letterId)
                .orElseThrow(() -> new Exception("letter not found"));
        letters.updateStatus(LetterStatus.REPORT);
        lettersRepository.save(letters);
        return true;
    }
}
