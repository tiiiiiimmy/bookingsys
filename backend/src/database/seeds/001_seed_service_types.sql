INSERT INTO service_types (id, duration_minutes, price_cents, name, name_zh, description, is_active)
VALUES
    (1, 30, 4500, 'Foot Massage', '脚部按摩', '以脚底和小腿放松为主，适合久站或久走后舒缓疲劳。', TRUE),
    (2, 30, 5500, 'Back Massage', '背部按摩', '重点放松背部与肩颈区域，适合久坐和肌肉紧张人群。', TRUE),
    (3, 30, 5000, 'Chest Massage', '胸前按摩', '以前侧胸肩区域放松与舒展为主，帮助打开上半身紧绷感。', TRUE),
    (4, 30, 5200, 'Shoulder Massage', '肩颈按摩', '集中缓解肩颈酸痛和上背僵硬。', TRUE),
    (5, 30, 4800, 'Leg Massage', '腿部按摩', '针对大腿与小腿放松，改善紧绷与沉重感。', TRUE)
ON DUPLICATE KEY UPDATE
    duration_minutes = VALUES(duration_minutes),
    price_cents = VALUES(price_cents),
    name = VALUES(name),
    name_zh = VALUES(name_zh),
    description = VALUES(description),
    is_active = VALUES(is_active);
