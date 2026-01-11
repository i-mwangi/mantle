const { drizzle } = require('drizzle-orm/libsql');
const { createClient } = require('@libsql/client');
const { eq } = require('drizzle-orm');
require('dotenv').config();

async function checkGrove() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  
  const db = drizzle(client);
  
  const result = await client.execute({
    sql: 'SELECT * FROM coffee_groves WHERE id = ?',
    args: [22]
  });
  
  console.log('Grove 22 data:');
  console.log(JSON.stringify(result.rows[0], null, 2));
  
  process.exit(0);
}

checkGrove();
