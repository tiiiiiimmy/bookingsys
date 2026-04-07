ALTER TABLE bookings
    ADD COLUMN manage_token VARCHAR(128) NULL AFTER notes,
    ADD COLUMN expires_at DATETIME NULL AFTER cancelled_at;

UPDATE bookings
SET manage_token = REPLACE(UUID(), '-', '')
WHERE manage_token IS NULL;

ALTER TABLE bookings
    MODIFY manage_token VARCHAR(128) NOT NULL;

CREATE UNIQUE INDEX idx_bookings_manage_token ON bookings (manage_token);
CREATE INDEX idx_bookings_expires_at ON bookings (expires_at);
