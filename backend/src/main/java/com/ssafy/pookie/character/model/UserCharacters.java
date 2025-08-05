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
public class UserCharacters {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    private UserAccounts userAccount;

    @ManyToOne
    private Characters character;

    private int exp;

    private boolean isDrop;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void upExp(int addedExp) {
        if (addedExp < 0) return;
        this.exp += addedExp;
    }

    public void resetExp() {
        this.exp = 0;
    }

    public void changeCharacter(Characters newCharacter) {
        this.character = newCharacter;
    }
}
