package com.ssafy.pookie.inventory.service;

import com.ssafy.pookie.auth.model.UserAccounts;
import com.ssafy.pookie.auth.repository.UserAccountsRepository;
import com.ssafy.pookie.inventory.dto.InventoryItemResponseDto;
import com.ssafy.pookie.inventory.model.InventoryItem;
import com.ssafy.pookie.inventory.repository.InventoryItemRepository;
import com.ssafy.pookie.store.model.StoreItem;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class InventoryServiceTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private UserAccountsRepository userAccountsRepository;

    @Autowired
    private SessionFactory sessionFactory;

    private UserAccounts testUser;
    private StoreItem testItem1;
    private StoreItem testItem2;
    private StoreItem testItem3;

    @BeforeEach
    void setUp() {
        testUser = UserAccounts.builder()
                .nickname("testUser")
                .build();
        testUser = userAccountsRepository.save(testUser);

        testItem1 = StoreItem.builder()
                .name("Test Item 1")
                .image("item1.png")
                .exp(10)
                .price(100)
                .build();

        testItem2 = StoreItem.builder()
                .name("Test Item 2")
                .image("item2.png")
                .exp(20)
                .price(200)
                .build();

        testItem3 = StoreItem.builder()
                .name("Test Item 3")
                .image("item3.png")
                .exp(30)
                .price(300)
                .build();

        Session session = sessionFactory.getCurrentSession();
        session.persist(testItem1);
        session.persist(testItem2);
        session.persist(testItem3);
        session.flush();

        InventoryItem inventoryItem1 = InventoryItem.builder()
                .userAccountIdx(testUser.getId())
                .storeItem(testItem1)
                .amount(5)
                .build();

        InventoryItem inventoryItem2 = InventoryItem.builder()
                .userAccountIdx(testUser.getId())
                .storeItem(testItem2)
                .amount(3)
                .build();

        InventoryItem inventoryItem3 = InventoryItem.builder()
                .userAccountIdx(testUser.getId())
                .storeItem(testItem3)
                .amount(2)
                .build();

        inventoryItemRepository.save(inventoryItem1);
        inventoryItemRepository.save(inventoryItem2);
        inventoryItemRepository.save(inventoryItem3);
        session.flush();
        session.clear();
    }

    @Test
    void testGetAllInventoryItems_NoN1Problem() {
        Statistics statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();

        List<InventoryItemResponseDto> result = inventoryService.getAllInventoryItems(testUser.getId());

        long queryCount = statistics.getQueryExecutionCount();

        assertEquals(3, result.size());
        
        assertTrue(queryCount <= 2, 
            String.format("Expected query count <= 2 (1 for user lookup + 1 for inventory with JOIN FETCH), but got %d queries", queryCount));

        InventoryItemResponseDto item1 = result.stream()
                .filter(item -> item.getItemName().equals("Test Item 1"))
                .findFirst()
                .orElse(null);
        
        assertNotNull(item1);
        assertEquals("Test Item 1", item1.getItemName());
        assertEquals("item1.png", item1.getImage());
        assertEquals(10, item1.getExp());
        assertEquals(5, item1.getAmount());

        System.out.println("Total queries executed: " + queryCount);
        System.out.println("Successfully avoided N+1 problem!");
    }

    @Test
    void testGetAllInventoryItems_QueryCountWithMultipleItems() {
        for (int i = 4; i <= 10; i++) {
            StoreItem additionalItem = StoreItem.builder()
                    .name("Additional Item " + i)
                    .image("item" + i + ".png")
                    .exp(i * 10)
                    .price(i * 100)
                    .build();

            Session session = sessionFactory.getCurrentSession();
            session.persist(additionalItem);

            InventoryItem additionalInventoryItem = InventoryItem.builder()
                    .userAccountIdx(testUser.getId())
                    .storeItem(additionalItem)
                    .amount(1)
                    .build();

            inventoryItemRepository.save(additionalInventoryItem);
        }

        Statistics statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();

        List<InventoryItemResponseDto> result = inventoryService.getAllInventoryItems(testUser.getId());

        long queryCount = statistics.getQueryExecutionCount();

        assertEquals(10, result.size());
        
        assertTrue(queryCount <= 2,
            String.format("With 10 items, expected query count <= 2, but got %d queries. This indicates N+1 problem!", queryCount));

        System.out.println("Total items: " + result.size());
        System.out.println("Total queries executed: " + queryCount);
    }

    @Test
    void testInventoryItemResponseDto_PropertyMapping() {
        List<InventoryItemResponseDto> result = inventoryService.getAllInventoryItems(testUser.getId());

        InventoryItemResponseDto item = result.get(0);
        
        assertNotNull(item.getIdx());
        assertNotNull(item.getUserAccountIdx());
        assertNotNull(item.getItemIdx());
        assertNotNull(item.getItemName());
        assertNotNull(item.getImage());
        assertTrue(item.getExp() > 0);
        assertTrue(item.getAmount() > 0);

        assertEquals(testUser.getId(), item.getUserAccountIdx());
    }

    @Test
    void testGetAllInventoryItems_EmptyInventory() {
        UserAccounts emptyUser = UserAccounts.builder()
                .nickname("emptyUser")
                .build();
        emptyUser = userAccountsRepository.save(emptyUser);

        Statistics statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();

        List<InventoryItemResponseDto> result = inventoryService.getAllInventoryItems(emptyUser.getId());

        long queryCount = statistics.getQueryExecutionCount();

        assertTrue(result.isEmpty());
        assertTrue(queryCount <= 2, "Even with empty inventory, should not have N+1 problem");

        System.out.println("Empty inventory queries executed: " + queryCount);
    }
}