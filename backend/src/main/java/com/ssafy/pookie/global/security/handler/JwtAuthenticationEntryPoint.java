package com.ssafy.pookie.global.security.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
        response.setContentType("application/json;charset=UTF-8");
        String message = authException.getMessage();
        if ("TOKEN_EXPIRED".equals(message)) {
            response.getWriter().write("{\"success\":false, \"message\":\"TOKEN_EXPIRED\"}");
        } else {
            response.getWriter().write("{\"success\":false, \"message\":\"Unauthorized - Invalid or expired token\"}");
        }
    }
}

