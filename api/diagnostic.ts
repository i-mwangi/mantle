/**
 * Diagnostic endpoint to check database loading
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...',
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      tursoTokenPrefix: process.env.TURSO_AUTH_TOKEN?.substring(0, 20) + '...',
      nodeVersion: process.version,
    },
    tests: {}
  };

  // Test 1: Can we import the database module?
  try {
    const dbModule = await import('../db/index.js');
    diagnostics.tests.dbImport = { success: true, hasDb: !!dbModule.db };
  } catch (error: any) {
    diagnostics.tests.dbImport = { 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    };
  }

  // Test 2: Can we import the schema module?
  try {
    const schemaModule = await import('../db/schema/index.js');
    diagnostics.tests.schemaImport = { 
      success: true, 
      hasCoffeeGroves: !!schemaModule.coffeeGroves,
      hasHarvestRecords: !!schemaModule.harvestRecords
    };
  } catch (error: any) {
    diagnostics.tests.schemaImport = { 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    };
  }

  // Test 3: Can we query the database?
  if (diagnostics.tests.dbImport?.success && diagnostics.tests.schemaImport?.success) {
    try {
      const { db } = await import('../db/index.js');
      const { coffeeGroves } = await import('../db/schema/index.js');
      const { sql } = await import('drizzle-orm');
      
      // First, check what tables exist in the database
      const tablesQuery = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
      diagnostics.tests.availableTables = {
        success: true,
        tables: tablesQuery
      };
      
      // Try to query coffeeGroves
      const allGroves = await db.select().from(coffeeGroves).limit(5);
      diagnostics.tests.dbQuery = { 
        success: true, 
        groveCount: allGroves.length,
        sample: allGroves[0] || null
      };
      
      // Try a raw SQL query to see if data exists
      const rawQuery = await db.all(sql`SELECT COUNT(*) as count FROM coffee_groves`);
      diagnostics.tests.rawQuery = {
        success: true,
        result: rawQuery
      };
      
    } catch (error: any) {
      diagnostics.tests.dbQuery = { 
        success: false, 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      };
    }
  }

  return res.status(200).json(diagnostics);
}
