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
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
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
      const { eq, sql } = await import('drizzle-orm');
      
      const allGroves = await db.select().from(coffeeGroves).limit(5);
      diagnostics.tests.dbQuery = { 
        success: true, 
        totalGroves: allGroves.length,
        sampleGrove: allGroves[0] ? {
          id: allGroves[0].id,
          name: allGroves[0].groveName,
          farmer: allGroves[0].farmerAddress
        } : null
      };
      
      // Test specific farmer query - case sensitive
      const farmerAddress = '0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9';
      const farmerGrovesCaseSensitive = await db.query.coffeeGroves.findMany({
        where: eq(coffeeGroves.farmerAddress, farmerAddress),
      });
      
      // Test case-insensitive query using LOWER()
      const farmerGrovesLower = await db.select()
        .from(coffeeGroves)
        .where(sql`LOWER(${coffeeGroves.farmerAddress}) = LOWER(${farmerAddress})`);
      
      diagnostics.tests.farmerQuery = {
        success: true,
        farmerAddress,
        caseSensitiveCount: farmerGrovesCaseSensitive.length,
        caseInsensitiveCount: farmerGrovesLower.length,
        sampleFarmerFromDb: allGroves[0]?.farmerAddress
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
