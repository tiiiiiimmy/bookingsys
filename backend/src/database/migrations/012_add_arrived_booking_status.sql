ALTER TABLE bookings DROP CHECK chk_status;

ALTER TABLE bookings
ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'arrived', 'cancelled', 'completed', 'no_show'));
