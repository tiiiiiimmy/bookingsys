ALTER TABLE product_orders
    ADD COLUMN price_cents INT NOT NULL DEFAULT 0 AFTER intention,
    ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL AFTER price_cents,
    MODIFY COLUMN status ENUM('pending', 'paid', 'fulfilled') NOT NULL DEFAULT 'pending';
