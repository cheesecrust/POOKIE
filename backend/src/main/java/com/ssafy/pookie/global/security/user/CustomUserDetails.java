package com.ssafy.pookie.global.security.user;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userAccountId;
    private final String email;
    private final String nickname;
    private final String role;
    private final int coin;

    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Long userAccountId, String email, String nickname, int coin,String role) {
        this.userAccountId = userAccountId;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
        this.coin = coin;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null; // JWT에서는 비밀번호 불필요
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
