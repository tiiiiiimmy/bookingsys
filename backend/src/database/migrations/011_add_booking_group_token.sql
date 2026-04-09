ALTER TABLE bookings
    ADD COLUMN booking_group_token VARCHAR(64) NULL AFTER manage_token;

CREATE INDEX idx_bookings_group_token ON bookings (booking_group_token);
