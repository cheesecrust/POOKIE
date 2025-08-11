package com.ssafy.pookie.character.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Getter
public class Characters {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PookieType type;

    private int step;
}
