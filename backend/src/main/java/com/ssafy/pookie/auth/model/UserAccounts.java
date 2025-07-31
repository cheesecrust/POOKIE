package com.ssafy.pookie.auth.model;

import com.ssafy.pookie.auth.model.base.Roles;
import com.ssafy.pookie.auth.model.base.Users;
import com.ssafy.pookie.character.model.UserCharacters;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserAccounts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Roles role;

    @Column(unique = true, length = 100, nullable = false)
    private String nickname;

    @Builder.Default
    @Min(0)
    private Integer coin = 0;

    @Builder.Default
    @Column(nullable = false)
    private boolean online = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean banned = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean isExit = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void updateOnline(boolean online) {
        this.online = online;
    }
}
