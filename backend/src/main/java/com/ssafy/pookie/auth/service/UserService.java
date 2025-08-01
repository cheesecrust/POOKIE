package com.ssafy.pookie.auth.service;

import com.ssafy.pookie.auth.dto.LoginRequestDto;
import com.ssafy.pookie.auth.dto.LoginResponseDto;
import com.ssafy.pookie.auth.dto.SignupRequestDto;
import com.ssafy.pookie.auth.dto.SignupResponseDto;
import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.model.base.Users;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.auth.repository.UsersRepository;
import com.ssafy.pookie.character.model.Characters;
import com.ssafy.pookie.character.model.PookieType;
import com.ssafy.pookie.character.service.CharacterService;
import com.ssafy.pookie.common.security.JwtTokenProvider;
import com.ssafy.pookie.friend.dto.FriendDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {

    private final UsersRepository usersRepository;
    private final UserAccountsRepository userAccountsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CharacterService characterService;

    public SignupResponseDto signup(SignupRequestDto signupRequest) {
        // 이메일 중복 확인
        if (usersRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        // 닉네임 중복 확인
        if (userAccountsRepository.existsByNickname(signupRequest.getNickname())) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
        }

        // 사용자 생성
        Users user = Users.builder()
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .build();

        UserAccounts account = UserAccounts.builder()
                .user(user)
                .nickname(signupRequest.getNickname())
                .build();

        Users savedUser = usersRepository.save(user);
        UserAccounts savedAccount = userAccountsRepository.save(account);
        Characters character = characterService.setUserPookie(savedAccount, PookieType.BASE);
        characterService.setPookieCatalog(savedAccount, character.getStep(), character.getType());
        characterService.changeRepPookie(savedAccount, character.getType(), character.getStep());

        return SignupResponseDto.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .nickname(savedAccount.getNickname())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    public LoginResponseDto login(LoginRequestDto loginRequest) {
        try {
            // 사용자 정보 조회
            Users user = usersRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            UserAccounts userAccount = user.getUserAccount();

            log.info(user.getPassword() + " " + loginRequest.getPassword());
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new Exception("비밀번호가 일치하지 않습니다.");
            }

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(userAccount.getId(), user.getEmail(), userAccount.getNickname());
            String refreshToken = jwtTokenProvider.createRefreshToken(userAccount.getId());

            return LoginResponseDto.builder()
                    .userAccountId(user.getId())
                    .email(user.getEmail())
                    .nickname(userAccount.getNickname())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();
        } catch (Exception e) {
            log.error("로그인 실패: {}", e.getMessage());
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
    }

    public void logout(String token) {
        if (token != null) {
            // TODO: 토큰을 블랙리스트에 추가하거나 Redis에서 삭제
        }
    }

    public LoginResponseDto refreshToken(String refreshToken) {
        try {
            // 리프레시 토큰 검증
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            // 사용자 ID 추출
            Long userAccountId = jwtTokenProvider.getUserIdFromToken(refreshToken);

            // 사용자 정보 조회
            Users user = usersRepository.findById(userAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            UserAccounts userAccount = user.getUserAccount();

            // 새로운 토큰 생성
            String newAccessToken = jwtTokenProvider.createAccessToken(userAccountId, user.getEmail(), user.getUserAccount().getNickname());
            String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

            return LoginResponseDto.builder()
                    .userAccountId(user.getId())
                    .email(user.getEmail())
                    .nickname(userAccount.getNickname())
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .build();
        } catch (Exception e) {
            log.error("토큰 갱신 실패: {}", e.getMessage());
            throw new IllegalArgumentException("토큰 갱신에 실패했습니다.");
        }
    }

    @Transactional(readOnly = true)
    public boolean isEmailDuplicate(String email) {
        return usersRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public SignupResponseDto getUserInfo(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        UserAccounts userAccount = user.getUserAccount();

        return SignupResponseDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(userAccount.getNickname())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public Page<UserAccounts> getUsers(String search, Pageable pageable) {
        return userAccountsRepository.findByNicknameContains(search, pageable);
    }
}

