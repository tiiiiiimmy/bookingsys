-- Seed service types with pricing
INSERT INTO service_types (duration_minutes, price_cents, name, name_zh, description, is_active)
VALUES
    (30, 5000, '30 Minute Session', '30分钟按摩', 'Quick relief massage focusing on problem areas', TRUE),
    (60, 9000, '60 Minute Session', '60分钟按摩', 'Standard full body therapeutic massage', TRUE),
    (90, 13000, '90 Minute Session', '90分钟按摩', 'Extended deep tissue and relaxation massage', TRUE)
ON DUPLICATE KEY UPDATE
    price_cents = VALUES(price_cents),
    name = VALUES(name),
    name_zh = VALUES(name_zh),
    description = VALUES(description),
    is_active = VALUES(is_active);
