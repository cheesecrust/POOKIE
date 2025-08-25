-- H2 호환 테스트 데이터
-- 푸키 생성하기
INSERT INTO characters (name, type, step) VALUES
                                              ('pookiepookie', 'BASE', 0),
                                              ('redpookie', 'RED', 1),
                                              ('strawberrypudding', 'RED', 2),
                                              ('buldakpudding', 'RED', 2),
                                              ('blueberrypudding', 'RED', 2),
                                              ('greenpookie', 'GREEN', 1),
                                              ('melonpudding', 'GREEN', 2),
                                              ('chocopudding', 'GREEN', 2),
                                              ('greenteapudding', 'GREEN', 2),
                                              ('yellowpookie', 'YELLOW', 1),
                                              ('creampudding', 'YELLOW', 2),
                                              ('milkpudding', 'YELLOW', 2),
                                              ('caramelpudding', 'YELLOW', 2);

-- 게임 타입 먼저 삽입 (H2 호환)
INSERT INTO game_types (game_name) VALUES ('SAMEPOSE');
INSERT INTO game_types (game_name) VALUES ('SILENTSCREAM');
INSERT INTO game_types (game_name) VALUES ('SKETCHRELAY');

-- 게임 키워드 삽입
INSERT INTO game_keywords (game_type_id, keyword) VALUES 
(1, 'test keyword 1'),
(1, 'test keyword 2'),
(2, 'test keyword 3'),
(3, 'test keyword 4');

-- 상점 아이템 기본 데이터
INSERT INTO store_item (item_name, item_type, price, description) VALUES
('Test Food', 'FOOD', 100, 'Test food item'),
('Test Background', 'BACKGROUND', 500, 'Test background item');