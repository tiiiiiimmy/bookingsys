UPDATE service_types
SET is_active = FALSE
WHERE id IN (1, 2, 3, 4, 5);

INSERT INTO service_types (id, duration_minutes, price_cents, name, name_zh, description, is_active)
VALUES
    (6, 60, 12000, 'Deep Tissue', '深層組織按摩', '針對肌肉底層壓力，緩解慢性疼痛與僵硬，重建身體活力。', TRUE),
    (7, 60, 10000, 'Swedish Aroma', '瑞典香氛療癒', '結合天然精油，溫和手法促進血液循環，讓心靈重獲輕盈感。', TRUE),
    (8, 90, 14500, 'Hot Stone', '熱石能量引導', '運用溫熱玄武岩石，溫暖身體核心，深度放鬆緊繃的韌帶與肌群。', TRUE),
    (9, 30, 6500, 'Focus Release', '頭肩頸釋壓', '針對久坐族群設計，快速緩解頸椎壓力與偏頭痛不適感。', TRUE)
ON DUPLICATE KEY UPDATE
    duration_minutes = VALUES(duration_minutes),
    price_cents = VALUES(price_cents),
    name = VALUES(name),
    name_zh = VALUES(name_zh),
    description = VALUES(description),
    is_active = VALUES(is_active);
