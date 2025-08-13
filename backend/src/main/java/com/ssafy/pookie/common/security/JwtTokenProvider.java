package com.ssafy.pookie.common.security;

import io.jsonwebtoken.*;
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
            @Value("${jwt.access-token-expiration:604800000}") long accessTokenExpiration, // 7일
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration // 7일
    ) {

        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;

//        log.info("JwtTokenProvider 초기화 완료 - AccessToken: {}ms, RefreshToken: {}ms",
//                accessTokenExpiration, refreshTokenExpiration);
    }

    /**
     * Access Token 생성
     */
    public String createAccessToken(Long userAccountId, String email, String nickname) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + accessTokenExpiration);

        String token = Jwts.builder()
                .setSubject(email)                          // 주체 (사용자 이메일)
                .claim("userAccountId", userAccountId)                    // 사용자 ID
                .claim("email", email)                      // 이메일
                .claim("nickname", nickname)
                .claim("provider", "local")                 // 로그인 타입
                .claim("type", "access")                    // 토큰 타입
                .setIssuedAt(now)                          // 발급 시간
                .setExpiration(expiration)                 // 만료 시간
                .signWith(secretKey, SignatureAlgorithm.HS256) // 서명
                .compact();

//        log.debug("Access Token 생성 - UserAccountId: {}, Email: {}, Expiration: {}",
//                userAccountId, email, expiration);

        return token;
    }

    /**
     * 소셜 로그인 전용 Access Token 생성 (10분짜리)
     */
    public String createSocialAccessToken(Long userAccountId, String email, String nickname, String provider) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + 10 * 60 * 1000L); // 10분

        String token = Jwts.builder()
                .setSubject(email)
                .claim("userAccountId", userAccountId)
                .claim("email", email)
                .claim("nickname", nickname)
                .claim("provider", provider)   // 소셜 제공자 (google, kakao 등)
                .claim("type", "access")
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

//        log.debug("Social Access Token 생성 - UserAccountId: {}, Email: {}, Expiration: {}",
//                userAccountId, email, expiration);

        return token;
    }

    /**
     * 소셜 로그인 전용 Refresh Token 생성
     */
    public String createSocialRefreshToken(Long userAccountId, String provider) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + refreshTokenExpiration);

        String token = Jwts.builder()
                .setSubject(userAccountId.toString())             // 주체 (사용자 ID)
                .claim("userAccountId", userAccountId)                   // 사용자 ID
                .claim("provider", provider)                // 로그인 타입
                .claim("type", "refresh")                  // 토큰 타입
                .setIssuedAt(now)                         // 발급 시간
                .setExpiration(expiration)                // 만료 시간
                .signWith(secretKey, SignatureAlgorithm.HS256) // 서명
                .compact();

//        log.debug("Refresh Token 생성 - UserAccountId: {}, Expiration: {}", userAccountId, expiration);

        return token;
    }

    /**
     * Refresh Token 생성
     */
    public String createRefreshToken(Long userAccountId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + refreshTokenExpiration);

        String token = Jwts.builder()
                .setSubject(userAccountId.toString())             // 주체 (사용자 ID)
                .claim("userAccountId", userAccountId)                   // 사용자 ID
                .claim("provider", "local")                 // 로그인 타입
                .claim("type", "refresh")                  // 토큰 타입
                .setIssuedAt(now)                         // 발급 시간
                .setExpiration(expiration)                // 만료 시간
                .signWith(secretKey, SignatureAlgorithm.HS256) // 서명
                .compact();

//        log.debug("Refresh Token 생성 - UserAccountId: {}, Expiration: {}", userAccountId, expiration);

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
        } catch (ExpiredJwtException e) {
            log.warn("토큰 만료: {}", e.getMessage());
            throw new JwtException("TOKEN_EXPIRED", e);
        } catch (JwtException e) {
            log.warn("토큰 검증 실패: {}", e.getMessage());
            throw new JwtException("TOKEN_INVALID", e);
        }
    }

    /**
     * TODO: redis 도입하여 black list 인지 안에 존재하는지 등을 판단합니다.
     */
    public boolean validateToken(String token) {
        try {
            getClaims(token); // 내부적으로 parseClaimsJws 수행
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("🔒 만료된 토큰입니다: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("🔒 유효하지 않은 토큰입니다: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 토큰에서 사용자 ID 추출
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("userAccountId", Long.class);
    }

    /**
     * 토큰에서 사용자 email 추출
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    public String getNicknameFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("nickname", String.class);
    }
    
    public String getProviderFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("provider", String.class);
    }
}
