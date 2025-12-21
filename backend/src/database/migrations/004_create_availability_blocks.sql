-- Create availability_blocks table
CREATE TABLE IF NOT EXISTS availability_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    block_type VARCHAR(20) NOT NULL DEFAULT 'blocked',
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_block_type CHECK (block_type IN ('blocked', 'available_override')),
    INDEX idx_availability_start_time (start_time),
    INDEX idx_availability_end_time (end_time),
    INDEX idx_availability_block_type (block_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
