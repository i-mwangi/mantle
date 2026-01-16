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
      tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 50) + '...',
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      tursoTokenPrefix: process.env.TURSO_AUTH_TOKEN?.substring(0, 30) + '...',
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

  // Test 3: Can we query the database using raw LibSQL client?
  if (diagnostics.tests.dbImport?.success) {
    try {
      const { createClient } = await import('@libsql/client');
      
      const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
      const tursoToken = process.env.TURSO_AUTH_TOKEN;
      
      if (!tursoUrl) {
        diagnostics.tests.rawClientQuery = {
          success: false,
          error: 'No TURSO_DATABASE_URL or DATABASE_URL found'
        };
      } else {
        const client = createClient({
          url: tursoUrl,
          authToken: tursoToken
        });
        
        // Count rows in coffee_groves
        const countResult = await client.execute('SELECT COUNT(*) as count FROM coffee_groves');
        diagnostics.tests.rawClientQuery = {
          success: true,
          coffee_groves_count: countResult.rows[0]?.count || 0
        };
        
        // Get sample groves
        const sampleResult = await client.execute('SELECT id, grove_name, farmer_address FROM coffee_groves LIMIT 3');
        diagnostics.tests.sampleGroves = {
          success: true,
          count: sampleResult.rows.length,
          samples: sampleResult.rows
        };
      }
    } catch (error: any) {
      diagnostics.tests.rawClientQuery = {
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      };
    }
  }

  // Test 4: Can we query using Drizzle ORM?
  if (diagnostics.tests.dbImport?.success && diagnostics.tests.schemaImport?.success) {
    try {
      const { db } = await import('../db/index.js');
      const { coffeeGroves } = await import('../db/schema/index.js');
      
      const allGroves = await db.select().from(coffeeGroves).limit(3);
      diagnostics.tests.drizzleQuery = { 
        success: true, 
        groveCount: allGroves.length,
        samples: allGroves
      };
      
    } catch (error: any) {
      diagnostics.tests.drizzleQuery = { 
        success: false, 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      };
    }
  }

  return res.status(200).json(diagnostics);
}
