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
@AllArgsConstructor
@Getter
@Builder
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "character_catalog",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_character_catalog_user_character",
                        columnNames = {"user_account_id", "character_id"})
        },
        indexes = {
                @Index(name = "idx_catalog_user", columnList = "user_account_id"),
                @Index(name = "idx_catalog_user_character", columnList = "user_account_id,character_id")
        }
)
public class CharacterCatalog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false)
    private UserAccounts userAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    private Characters character;

    @Column(nullable = false)
    private boolean isRepresent;

    @Column(nullable = false)
    private boolean isGrowing;

    @CreatedDate @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void setRepresent(boolean represent) { this.isRepresent = represent; }
    public void setGrowing(boolean growing) { this.isGrowing = growing; }
}
