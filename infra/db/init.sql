CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGSERIAL UNIQUE NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'fulfilled', 'cancelled')),
    total_cents INTEGER NOT NULL CHECK (total_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at DESC);
INSERT INTO orders (customer_name, status, total_cents)
SELECT 'Sample customer', 'pending', 2499
WHERE NOT EXISTS (SELECT 1 FROM orders);
