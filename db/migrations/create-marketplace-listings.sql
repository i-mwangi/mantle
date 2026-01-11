-- Create marketplace listings table for secondary market
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_address TEXT NOT NULL,
    grove_id INTEGER NOT NULL,
    token_address TEXT NOT NULL,
    grove_name TEXT NOT NULL,
    token_amount INTEGER NOT NULL,
    price_per_token INTEGER NOT NULL,
    total_value INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
    sold_at INTEGER,
    buyer_address TEXT,
    transaction_hash TEXT,
    FOREIGN KEY (grove_id) REFERENCES coffee_groves(id)
);

CREATE INDEX IF NOT EXISTS marketplace_listings_seller_idx ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS marketplace_listings_grove_idx ON marketplace_listings(grove_id);
CREATE INDEX IF NOT EXISTS marketplace_listings_status_idx ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS marketplace_listings_expires_idx ON marketplace_listings(expires_at);
