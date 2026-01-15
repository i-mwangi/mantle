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

    // Market overview - return mock data
    if (url.includes('/api/market/overview')) {
      return res.status(200).json({
        success: true,
        totalGroves: 0,
        activeFarmers: 0,
        totalRevenue: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Market prices - return mock data
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

    // For all database-dependent endpoints, return empty/mock data
    // This allows the frontend to work without a database
    
    // Groves endpoints
    if (url.includes('/api/groves')) {
      return res.status(200).json({
        success: true,
        groves: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Harvest endpoints
    if (url.includes('/api/harvest')) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Revenue endpoints
    if (url.includes('/api/revenue')) {
      return res.status(200).json({
        success: true,
        data: {
          availableBalance: 0,
          pendingDistribution: 0,
          totalWithdrawn: 0,
        },
        message: 'Database not available - using demo mode',
      });
    }

    // Funding endpoints
    if (url.includes('/api/funding')) {
      return res.status(200).json({
        success: true,
        requests: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Pricing endpoints
    if (url.includes('/api/pricing')) {
      return res.status(200).json({
        success: true,
        prices: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Admin endpoints
    if (url.includes('/api/admin')) {
      return res.status(200).json({
        success: false,
        isAdmin: false,
        message: 'Database not available - using demo mode',
      });
    }

    // Farmer withdrawals
    if (url.includes('/api/farmer/withdrawals')) {
      return res.status(200).json({
        success: true,
        withdrawals: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Investment endpoints
    if (url.includes('/api/investment')) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Investor endpoints
    if (url.includes('/api/investor')) {
      return res.status(200).json({
        success: true,
        data: {
          balance: 0,
          earnings: [],
          withdrawals: [],
        },
        message: 'Database not available - using demo mode',
      });
    }

    // Marketplace endpoints
    if (url.includes('/api/marketplace')) {
      return res.status(200).json({
        success: true,
        listings: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Lending endpoints
    if (url.includes('/api/lending')) {
      return res.status(200).json({
        success: true,
        pools: [],
        message: 'Database not available - using demo mode',
      });
    }

    // Credit score
    if (url.includes('/api/credit-score')) {
      return res.status(200).json({
        success: true,
        score: null,
        message: 'Database not available - using demo mode',
      });
    }

    // 404
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
