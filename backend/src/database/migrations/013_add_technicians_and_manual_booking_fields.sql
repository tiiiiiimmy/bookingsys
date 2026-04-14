CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    display_name_zh VARCHAR(255) NULL,
    bio TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_technicians_is_active (is_active),
    INDEX idx_technicians_display_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bookings
    ADD COLUMN technician_id INT NULL AFTER service_type_id,
    ADD COLUMN created_via VARCHAR(20) NOT NULL DEFAULT 'public' AFTER status,
    ADD COLUMN payment_mode VARCHAR(40) NULL AFTER created_via,
    ADD CONSTRAINT fk_bookings_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_technician_id ON bookings (technician_id);
CREATE INDEX idx_bookings_created_via ON bookings (created_via);
CREATE INDEX idx_bookings_payment_mode ON bookings (payment_mode);

ALTER TABLE payments
    MODIFY stripe_payment_intent_id VARCHAR(255) NULL,
    ADD COLUMN payment_source VARCHAR(20) NOT NULL DEFAULT 'stripe' AFTER currency;

CREATE INDEX idx_payments_source ON payments (payment_source);
