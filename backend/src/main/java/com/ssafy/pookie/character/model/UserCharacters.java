package com.ssafy.pookie.character.model;

import com.ssafy.pookie.auth.model.UserAccounts;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@Getter
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "user_characters",
        indexes = {
                @Index(name = "idx_uc_user", columnList = "user_account_id"),
                @Index(name = "idx_uc_user_character", columnList = "user_account_id,character_id")
        }
)
public class UserCharacters {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false)
    private UserAccounts userAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    private Characters character;

    @Column(nullable = false)
    private int exp;

    @Column(nullable = false)
    private boolean isDrop;

    @CreatedDate @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    // 도메인 메서드
    public void upExp(int addedExp) { if (addedExp > 0) this.exp += addedExp; }
    public void setMaxExpForLevelUp(int maxExp) { this.exp = maxExp; }
    public void resetExp() { this.exp = 0; }
    public void setDrop(boolean drop) { this.isDrop = drop; } // 복구/드랍 토글용
}
