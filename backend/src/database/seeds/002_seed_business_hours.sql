-- Seed business hours
-- Operating hours: Thursday (day 4) and Sunday (day 0), 9:00 AM - 5:00 PM
INSERT INTO business_hours (day_of_week, start_time, end_time, is_active)
VALUES
    (0, '09:00:00', '17:00:00', TRUE),   -- Sunday: Open
    (1, '09:00:00', '17:00:00', FALSE),  -- Monday: Closed
    (2, '09:00:00', '17:00:00', FALSE),  -- Tuesday: Closed
    (3, '09:00:00', '17:00:00', FALSE),  -- Wednesday: Closed
    (4, '09:00:00', '17:00:00', TRUE),   -- Thursday: Open
    (5, '09:00:00', '17:00:00', FALSE),  -- Friday: Closed
    (6, '09:00:00', '17:00:00', FALSE)   -- Saturday: Closed
ON DUPLICATE KEY UPDATE
    start_time = VALUES(start_time),
    end_time = VALUES(end_time),
    is_active = VALUES(is_active);
