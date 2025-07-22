package com.ssafy.pookie.global.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement((sessionManagement)
                        -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 미사용
                /*
                   TODO
                    개발 과정, 모든 요청 허용
                    -> 개발 완료 후 수정 필요
                 */
//                .authorizeHttpRequests((authorize) -> authorize
//                        .requestMatchers("/signup", "/", "/login").permitAll()
//                        .anyRequest().authenticated())
                .authorizeHttpRequests((authorize)->authorize.anyRequest().permitAll());

        return http.build();
    }
}
