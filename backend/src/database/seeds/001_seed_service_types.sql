-- Deactivate old services
UPDATE service_types
SET is_active = FALSE
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9);

-- Psychic Reading: 15 / 30 / 60 min
INSERT INTO service_types (id, duration_minutes, price_cents, name, name_zh, description, is_active)
VALUES
    (10, 15, 2600, 'Psychic Reading', 'Psychic Reading', 'A 15-minute intuitive reading to gain quick clarity on a specific question or situation.', TRUE),
    (11, 30, 4800, 'Psychic Reading', 'Psychic Reading', 'A 30-minute in-depth reading covering love, career, or personal guidance.', TRUE),
    (12, 60, 8800, 'Psychic Reading', 'Psychic Reading', 'A full 60-minute session for comprehensive spiritual guidance across all areas of your life.', TRUE)
ON DUPLICATE KEY UPDATE
    duration_minutes = VALUES(duration_minutes),
    price_cents      = VALUES(price_cents),
    name             = VALUES(name),
    name_zh          = VALUES(name_zh),
    description      = VALUES(description),
    is_active        = VALUES(is_active);
