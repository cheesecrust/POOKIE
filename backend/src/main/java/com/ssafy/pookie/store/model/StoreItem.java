package com.ssafy.pookie.store.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StoreItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;   // 고유 인덱스 (PK)

    @Column(nullable = false, length = 100)
    private String name;   // 아이템 이름

    @Column(length = 255)
    private String image;  // 아이템 이미지 (파일명 or 키)

    private int exp;       // 얻을 수 있는 경험치
    private int price;     // 가격

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}