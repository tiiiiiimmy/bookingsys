-- Seed service types with pricing
INSERT INTO service_types (duration_minutes, price_cents, name, description, is_active)
VALUES
    (30, 5000, '30 Minute Session', 'Quick relief massage focusing on problem areas', TRUE),
    (60, 9000, '60 Minute Session', 'Standard full body therapeutic massage', TRUE),
    (90, 13000, '90 Minute Session', 'Extended deep tissue and relaxation massage', TRUE)
ON DUPLICATE KEY UPDATE
    price_cents = VALUES(price_cents),
    name = VALUES(name),
    description = VALUES(description),
    is_active = VALUES(is_active);
