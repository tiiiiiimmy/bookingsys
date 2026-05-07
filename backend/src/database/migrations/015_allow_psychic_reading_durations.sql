ALTER TABLE bookings DROP CHECK chk_duration;

ALTER TABLE bookings
ADD CONSTRAINT chk_duration CHECK (duration_minutes IN (10, 20, 30, 60, 90));
