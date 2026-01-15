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
      });
    }

    // Market overview - return mock data for now
    if (url.includes('/api/market/overview')) {
      return res.status(200).json({
        success: true,
        totalGroves: 0,
        activeFarmers: 0,
        totalRevenue: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Market prices - return mock data for now
    if (url.includes('/api/market/prices')) {
      return res.status(200).json({
        success: true,
        prices: [
          {
            variety: 'Arabica',
            price: 4.25,
            change: 2.5,
            timestamp: Date.now(),
          },
          {
            variety: 'Robusta',
            price: 2.15,
            change: -1.2,
            timestamp: Date.now(),
          },
        ],
      });
    }

    // For all other endpoints, try to load the full router
    const { handleMantleAPI } = await import('./mantle-api-router.js');
    return handleMantleAPI(req, res);
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
