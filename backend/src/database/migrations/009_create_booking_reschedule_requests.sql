CREATE TABLE booking_reschedule_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    requested_start_time DATETIME NOT NULL,
    requested_end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    customer_note TEXT NULL,
    admin_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    CONSTRAINT fk_booking_reschedule_requests_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT chk_booking_reschedule_request_status CHECK (status IN ('pending', 'approved', 'rejected')),
    INDEX idx_booking_reschedule_requests_booking_id (booking_id),
    INDEX idx_booking_reschedule_requests_status (status),
    INDEX idx_booking_reschedule_requests_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
