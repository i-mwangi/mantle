import { createClient } from '@libsql/client';
import 'dotenv/config';

async function fixTableNames() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!
    });
    
    console.log('🔧 Creating tables with correct snake_case names...');
    
    // Create coffee_groves (the schema expects this name)
    await client.execute(`
        CREATE TABLE IF NOT EXISTS coffee_groves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grove_name TEXT NOT NULL UNIQUE,
            farmer_address TEXT NOT NULL,
            token_address TEXT UNIQUE,
            token_symbol TEXT,
            location TEXT NOT NULL,
            coordinates_lat REAL,
            coordinates_lng REAL,
            tree_count INTEGER NOT NULL,
            coffee_variety TEXT NOT NULL,
            planting_date INTEGER,
            expected_yield_per_tree INTEGER,
            total_tokens_issued INTEGER,
            tokens_sold INTEGER DEFAULT 0 NOT NULL,
            tokens_per_tree INTEGER,
            verification_status TEXT DEFAULT 'pending',
            current_health_score INTEGER,
            is_tokenized INTEGER DEFAULT 0,
            tokenized_at INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
    `);
    
    console.log('coffee_groves table created');
    
    // List all tables to verify
    const tables = await client.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `);
    
    console.log(`\n📊 Total tables: ${tables.rows.length}`);
    
    // Check if coffee_groves exists
    const hasCoffeeGroves = tables.rows.some(r => r.name === 'coffee_groves');
    console.log(`✅ coffee_groves exists: ${hasCoffeeGroves}`);
}

fixTableNames();
