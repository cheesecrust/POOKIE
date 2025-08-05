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
public class CharacterCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    private UserAccounts userAccount;

    @ManyToOne
    private Characters character;

    private boolean isRepresent;

    private boolean isGrowing;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void updateIsRep(boolean isRepresent) {
        this.isRepresent = isRepresent;
    }

    public void updateIsGrowing(boolean isGrowing) {
        this.isGrowing = isGrowing;
    }
}
