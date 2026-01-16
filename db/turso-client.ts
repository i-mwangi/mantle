/**
 * Direct Turso Client Wrapper
 * Bypasses Drizzle ORM to avoid CommonJS/ES module schema mismatch issues
 */

import { createClient } from '@libsql/client';

let clientInstance: any = null;

export function getTursoClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl) {
    throw new Error('TURSO_DATABASE_URL or DATABASE_URL is required');
  }

  clientInstance = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });

  return clientInstance;
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase
 */
function convertKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[toCamelCase(key)] = convertKeysToCamelCase(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

/**
 * Execute a SQL query and return results with camelCase keys
 */
export async function executeQuery(sql: string, args?: any[]) {
  const client = getTursoClient();
  const result = await client.execute(args ? { sql, args } : sql);
  return convertKeysToCamelCase(result.rows);
}

/**
 * Get all coffee groves
 */
export async function getAllGroves() {
  return executeQuery('SELECT * FROM coffee_groves ORDER BY created_at DESC');
}

/**
 * Get groves by farmer address
 */
export async function getGrovesByFarmer(farmerAddress: string) {
  return executeQuery(
    'SELECT * FROM coffee_groves WHERE farmer_address = ? ORDER BY created_at DESC',
    [farmerAddress]
  );
}

/**
 * Get grove by ID
 */
export async function getGroveById(id: number) {
  const results = await executeQuery('SELECT * FROM coffee_groves WHERE id = ?', [id]);
  return results[0] || null;
}

/**
 * Get harvest records for a grove
 */
export async function getHarvestRecordsByGrove(groveId: number) {
  return executeQuery(
    'SELECT * FROM harvest_records WHERE grove_id = ? ORDER BY harvest_date DESC',
    [groveId]
  );
}
