import { createClient } from '@libsql/client';
import 'dotenv/config';

async function verifyTables() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!
    });
    
    const tables = await client.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    `);
    
    console.log('📊 All tables in Turso:');
    tables.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.name}`);
    });
    
    // Check specifically for coffee_groves
    const hasCoffeeGroves = tables.rows.some(r => r.name === 'coffee_groves');
    console.log(`\n✅ coffee_groves exists: ${hasCoffeeGroves}`);
    
    if (hasCoffeeGroves) {
        // Try to query it
        const result = await client.execute('SELECT COUNT(*) as count FROM coffee_groves');
        console.log(`📝 Rows in coffee_groves: ${result.rows[0].count}`);
    }
}

verifyTables();
