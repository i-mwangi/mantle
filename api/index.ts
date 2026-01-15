/**
 * Vercel Serverless Function Entry Point
 * Single entry point for all API routes - Now using Mantle Network
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  
  try {
    // Health check - no database required
    if (url.includes('/health')) {
      return res.status(200).json({
        success: true,
        message: 'Mantle API is running',
        network: 'Mantle Sepolia',
        timestamp: new Date().toISOString(),
        database: process.env.TURSO_DATABASE_URL ? 'Turso configured' : 'No database',
      });
    }

    // Try to load the full router with database
    try {
      const { handleMantleAPI } = await import('./mantle-api-router.js');
      return handleMantleAPI(req, res);
    } catch (dbError: any) {
      console.error('Database router failed, using fallback:', dbError.message);
      
      // Fallback responses for common endpoints
      if (url.includes('/api/market/overview')) {
        return res.status(200).json({
          success: true,
          totalGroves: 0,
          activeFarmers: 0,
          totalRevenue: 0,
          timestamp: new Date().toISOString(),
        });
      }

      if (url.includes('/api/market/prices')) {
        return res.status(200).json({
          success: true,
          prices: [
            { variety: 'Arabica', price: 4.25, change: 2.5, timestamp: Date.now() },
            { variety: 'Robusta', price: 2.15, change: -1.2, timestamp: Date.now() },
          ],
        });
      }

      if (url.includes('/api/groves')) {
        return res.status(200).json({ success: true, groves: [] });
      }

      if (url.includes('/api/harvest')) {
        return res.status(200).json({ success: true, data: [] });
      }

      if (url.includes('/api/revenue')) {
        return res.status(200).json({
          success: true,
          data: { availableBalance: 0, pendingDistribution: 0, totalWithdrawn: 0 },
        });
      }

      if (url.includes('/api/funding')) {
        return res.status(200).json({ success: true, requests: [] });
      }

      if (url.includes('/api/farmer/withdrawals')) {
        return res.status(200).json({ success: true, withdrawals: [] });
      }

      if (url.includes('/api/investor')) {
        return res.status(200).json({
          success: true,
          data: { balance: 0, earnings: [], withdrawals: [] },
        });
      }

      // Generic fallback
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Database not available - using demo mode',
      });
    }
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
