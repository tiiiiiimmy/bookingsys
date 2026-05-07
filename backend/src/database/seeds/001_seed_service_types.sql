UPDATE service_types
SET is_active = FALSE;

INSERT INTO service_types (id, duration_minutes, price_cents, name, name_zh, description, is_active)
VALUES
    (10, 10, 8000, 'Psychic Reading - 10 minutes', 'Psychic Reading - 10 mins', 'International phone call or online meeting psychic reading.', TRUE),
    (11, 20, 18000, 'Psychic Reading - 20 minutes', 'Psychic Reading - 20 mins', 'International phone call or online meeting psychic reading.', TRUE),
    (12, 60, 28000, 'Psychic Reading - 60 minutes', 'Psychic Reading - 60 mins', 'International phone call or online meeting psychic reading.', TRUE)
ON DUPLICATE KEY UPDATE
    duration_minutes = VALUES(duration_minutes),
    price_cents = VALUES(price_cents),
    name = VALUES(name),
    name_zh = VALUES(name_zh),
    description = VALUES(description),
    is_active = VALUES(is_active);
