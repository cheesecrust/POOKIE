package com.ssafy.pookie.global.security.config;

import com.ssafy.pookie.global.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 출처 설정
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        // 또는 특정 도메인만 허용: configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://your-domain.com"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 허용할 헤더
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // 자격 증명 허용 (쿠키, Authorization 헤더 등)
        configuration.setAllowCredentials(true);

        // 노출할 헤더 (클라이언트에서 접근 가능한 헤더)
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count"));

        // preflight 요청 캐시 시간 (초)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 비활성화 (JWT 사용으로 불필요)
                .csrf(AbstractHttpConfigurer::disable)

                // HTTP Basic 인증 비활성화
                .httpBasic(AbstractHttpConfigurer::disable)

                // Form 로그인 비활성화
                .formLogin(AbstractHttpConfigurer::disable)

                // CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 세션 관리 정책: STATELESS (세션 사용 안함)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())  // WebSocket iframe 허용
                        .contentTypeOptions(contentTypeOptions -> contentTypeOptions.disable())
                        .httpStrictTransportSecurity(hstsConfig -> hstsConfig.disable())  // 개발 환경에서는 비활성화
                )

                // TODO: 예외처리
                /*
                .exceptionHandling(exception -> exception
                    .authenticationEntryPoint(jwtAuthenticationEntryPoint)  // 인증 실패 시
                    .accessDeniedHandler(jwtAccessDeniedHandler)            // 권한 부족 시
                )
                 */

                // URL별 접근 권한 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 인증 없이 접근 가능한 URL
                        .requestMatchers(
                                "/auth/**",           // 인증 관련 API
                                "/public/**",         // 공개 API
                                "/health",                // 헬스체크
                                "/actuator/**",           // 액추에이터
                                "/swagger-ui/**",         // Swagger UI
                                "/v3/api-docs/**",        // OpenAPI 문서
                                "/swagger-resources/**",   // Swagger 리소스
                                "/webjars/**",            // Swagger 웹 자원
                                "/error",                  // 에러 페이지
                                "/game"
                        ).permitAll()

                        // 관리자만 접근 가능한 URL
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 사용자 권한이 필요한 URL
                        .requestMatchers("/api/user/**").hasRole("USER")

                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 이전에 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
