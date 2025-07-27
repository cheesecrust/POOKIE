package com.ssafy.pookie.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    // 생성자에서 설정값 주입
    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:3600000}") long accessTokenExpiration, // 1시간
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration // 7일
    ) {

        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;

        log.info("JwtTokenProvider 초기화 완료 - AccessToken: {}ms, RefreshToken: {}ms",
                accessTokenExpiration, refreshTokenExpiration);
    }

    /**
     * Access Token 생성
     */
    public String createAccessToken(Long userId, String email) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + accessTokenExpiration);

        String token = Jwts.builder()
                .setSubject(email)                          // 주체 (사용자 이메일)
                .claim("userId", userId)                    // 사용자 ID
                .claim("email", email)                      // 이메일
                .claim("type", "access")                    // 토큰 타입
                .setIssuedAt(now)                          // 발급 시간
                .setExpiration(expiration)                 // 만료 시간
                .signWith(secretKey, SignatureAlgorithm.HS256) // 서명
                .compact();

        log.debug("Access Token 생성 - UserId: {}, Email: {}, Expiration: {}",
                userId, email, expiration);

        return token;
    }

    /**
     * Refresh Token 생성
     */
    public String createRefreshToken(Long userId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + refreshTokenExpiration);

        String token = Jwts.builder()
                .setSubject(userId.toString())             // 주체 (사용자 ID)
                .claim("userId", userId)                   // 사용자 ID
                .claim("type", "refresh")                  // 토큰 타입
                .setIssuedAt(now)                         // 발급 시간
                .setExpiration(expiration)                // 만료 시간
                .signWith(secretKey, SignatureAlgorithm.HS256) // 서명
                .compact();

        log.debug("Refresh Token 생성 - UserId: {}, Expiration: {}", userId, expiration);

        return token;
    }

    /**
     * 토큰에서 Claims 추출
     */
    public Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            log.warn("토큰 파싱 실패: {}", e.getMessage());
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }

    /**
     * 토큰에서 사용자 ID 추출
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("userId", Long.class);
    }

    /**
     * 토큰에서 사용자 email 추출
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    /**
     * TODO: redis 도입하여 black list 인지 안에 존재하는지 등을 판단합니다.
     */
    public boolean validateToken(String refreshToken) {
        return true;
    }
}
