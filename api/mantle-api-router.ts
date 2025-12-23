/**
 * Mantle API Router
 * Handles all API endpoints using Mantle services
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMantleTokenizationService } from '../lib/api/mantle-tokenization-service.js';
import { getMantlePaymentService } from '../lib/api/mantle-payment-service.js';
import { getMantleLendingService } from '../lib/api/mantle-lending-service.js';
import { getMantleFarmerService } from '../lib/api/mantle-farmer-service.js';
import { getMantlePriceOracleService } from '../lib/api/mantle-price-oracle-service.js';
import { db } from '../db/index.js';
import { coffeeGroves, farmers, harvestRecords } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Main API handler
 */
export async function handleMantleAPI(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health check
    if (url.includes('/health')) {
      return res.status(200).json({
        success: true,
        message: 'Mantle API is running',
        network: 'Mantle Sepolia',
        timestamp: new Date().toISOString(),
      });
    }

    // Grove tokenization
    if (url.includes('/groves/tokenize') && method === 'POST') {
      return await handleTokenizeGrove(req, res);
    }

    // Get grove info
    if (url.includes('/groves/') && method === 'GET') {
      return await handleGetGrove(req, res);
    }

    // List groves
    if (url.includes('/groves') && method === 'GET') {
      return await handleListGroves(req, res);
    }

    // Register grove
    if (url.includes('/groves/register') && method === 'POST') {
      return await handleRegisterGrove(req, res);
    }

    // Farmer verification
    if (url.includes('/farmers/verify') && method === 'POST') {
      return await handleVerifyFarmer(req, res);
    }

    // Check farmer verification
    if (url.includes('/farmers/check/') && method === 'GET') {
      return await handleCheckFarmer(req, res);
    }

    // Lending: Deposit
    if (url.includes('/lending/deposit') && method === 'POST') {
      return await handleDeposit(req, res);
    }

    // Lending: Withdraw
    if (url.includes('/lending/withdraw') && method === 'POST') {
      return await handleWithdraw(req, res);
    }

    // Lending: Borrow
    if (url.includes('/lending/borrow') && method === 'POST') {
      return await handleBorrow(req, res);
    }

    // Lending: Repay
    if (url.includes('/lending/repay') && method === 'POST') {
      return await handleRepay(req, res);
    }

    // Get user balance
    if (url.includes('/balance/') && method === 'GET') {
      return await handleGetBalance(req, res);
    }

    // Price oracle: Update price
    if (url.includes('/price/update') && method === 'POST') {
      return await handleUpdatePrice(req, res);
    }

    // Price oracle: Get price
    if (url.includes('/price') && method === 'GET') {
      return await handleGetPrice(req, res);
    }

    // Payment: Send USDC
    if (url.includes('/payment/send') && method === 'POST') {
      return await handleSendPayment(req, res);
    }

    // Market: Get price history
    if (url.includes('/api/market/prices') && method === 'GET') {
      return await handleGetPriceHistory(req, res);
    }

    // Market: Get overview
    if (url.includes('/api/market/overview') && method === 'GET') {
      return await handleGetMarketOverview(req, res);
    }

    // Harvest: Get history
    if (url.includes('/api/harvest/history') && method === 'GET') {
      return await handleGetHarvestHistory(req, res);
    }

    // Harvest: Get stats
    if (url.includes('/api/harvest/stats') && method === 'GET') {
      return await handleGetHarvestStats(req, res);
    }

    // Harvest: Report harvest
    if (url.includes('/api/harvest/report') && method === 'POST') {
      return await handleReportHarvest(req, res);
    }

    // Farmer: Get withdrawals
    if (url.includes('/api/farmer/withdrawals/') && method === 'GET') {
      return await handleGetFarmerWithdrawals(req, res);
    }

    // Revenue: Get farmer balance
    if (url.includes('/api/revenue/farmer-balance') && method === 'GET') {
      return await handleGetFarmerBalance(req, res);
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
    });
  }
}

/**
 * Tokenize a grove
 */
async function handleTokenizeGrove(req: VercelRequest, res: VercelResponse) {
  const { groveName, location, numberOfTrees, tokensPerTree, farmerAddress } = req.body;

  if (!groveName || !location || !numberOfTrees || !tokensPerTree || !farmerAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
  }

  const tokenService = getMantleTokenizationService();
  const result = await tokenService.tokenizeGrove({
    groveName,
    location,
    numberOfTrees,
    tokensPerTree,
    farmerAddress,
  });

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get grove info
 */
async function handleGetGrove(req: VercelRequest, res: VercelResponse) {
  const groveName = req.url?.split('/').pop() || '';

  if (!groveName) {
    return res.status(400).json({
      success: false,
      error: 'Invalid grove name',
    });
  }

  const tokenService = getMantleTokenizationService();
  const groveInfo = await tokenService.getGroveInfo(groveName);

  return res.status(200).json({
    success: true,
    grove: groveInfo,
  });
}

/**
 * List all groves
 */
async function handleListGroves(req: VercelRequest, res: VercelResponse) {
  const groves = await db.query.coffeeGroves.findMany({
    orderBy: (groves, { desc }) => [desc(groves.createdAt)],
  });

  return res.status(200).json({
    success: true,
    groves,
  });
}

/**
 * Register a new grove
 */
async function handleRegisterGrove(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      groveName,
      location,
      latitude,
      longitude,
      treeCount,
      coffeeVariety,
      expectedYieldPerTree,
      tokensPerTree,
      farmerAddress,
      termsAccepted,
      termsVersion
    } = req.body;

    // Validate required fields
    if (!groveName || !location || !treeCount || !coffeeVariety || !farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Insert grove into database
    const result = await db.insert(coffeeGroves).values({
      groveName,
      farmerAddress,
      location,
      coordinatesLat: latitude,
      coordinatesLng: longitude,
      treeCount,
      coffeeVariety,
      expectedYieldPerTree: expectedYieldPerTree || 0,
      tokensPerTree: tokensPerTree || 10,
      verificationStatus: 'pending',
      currentHealthScore: Math.floor(Math.random() * 20) + 70, // Random 70-90
      isTokenized: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    return res.status(200).json({
      success: true,
      message: 'Grove registered successfully',
      grove: result[0],
    });
  } catch (error: any) {
    console.error('Error registering grove:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to register grove',
    });
  }
}

/**
 * Verify farmer
 */
async function handleVerifyFarmer(req: VercelRequest, res: VercelResponse) {
  const { farmerAddress } = req.body;

  if (!farmerAddress) {
    return res.status(400).json({
      success: false,
      error: 'Farmer address required',
    });
  }

  const farmerService = getMantleFarmerService();
  const result = await farmerService.verifyFarmer(farmerAddress);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Check farmer verification
 */
async function handleCheckFarmer(req: VercelRequest, res: VercelResponse) {
  const farmerAddress = req.url?.split('/').pop();

  if (!farmerAddress) {
    return res.status(400).json({
      success: false,
      error: 'Farmer address required',
    });
  }

  const farmerService = getMantleFarmerService();
  const isVerified = await farmerService.isVerified(farmerAddress);

  return res.status(200).json({
    success: true,
    farmerAddress,
    isVerified,
  });
}

/**
 * Deposit to lending pool
 */
async function handleDeposit(req: VercelRequest, res: VercelResponse) {
  const { userAddress, amount } = req.body;

  if (!userAddress || !amount) {
    return res.status(400).json({
      success: false,
      error: 'User address and amount required',
    });
  }

  const lendingService = getMantleLendingService();
  const result = await lendingService.deposit(userAddress, amount);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Withdraw from lending pool
 */
async function handleWithdraw(req: VercelRequest, res: VercelResponse) {
  const { userAddress, amount } = req.body;

  if (!userAddress || !amount) {
    return res.status(400).json({
      success: false,
      error: 'User address and amount required',
    });
  }

  const lendingService = getMantleLendingService();
  const result = await lendingService.withdraw(userAddress, amount);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Borrow from lending pool
 */
async function handleBorrow(req: VercelRequest, res: VercelResponse) {
  const { borrowerAddress, collateralTokenAddress, collateralAmount, borrowAmount } = req.body;

  if (!borrowerAddress || !collateralTokenAddress || !collateralAmount || !borrowAmount) {
    return res.status(400).json({
      success: false,
      error: 'All fields required',
    });
  }

  const lendingService = getMantleLendingService();
  const result = await lendingService.borrow(
    borrowerAddress,
    collateralTokenAddress,
    collateralAmount,
    borrowAmount
  );

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Repay loan
 */
async function handleRepay(req: VercelRequest, res: VercelResponse) {
  const { borrowerAddress, loanId, amount } = req.body;

  if (!borrowerAddress || loanId === undefined || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Borrower address, loan ID, and amount required',
    });
  }

  const lendingService = getMantleLendingService();
  const result = await lendingService.repay(borrowerAddress, loanId, amount);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get user balance
 */
async function handleGetBalance(req: VercelRequest, res: VercelResponse) {
  const address = req.url?.split('/').pop();

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Address required',
    });
  }

  const paymentService = getMantlePaymentService();
  const usdcBalance = await paymentService.getUSDCBalance(address);

  return res.status(200).json({
    success: true,
    address,
    usdcBalance,
  });
}

/**
 * Update coffee price
 */
async function handleUpdatePrice(req: VercelRequest, res: VercelResponse) {
  const { priceInCents } = req.body;

  if (!priceInCents) {
    return res.status(400).json({
      success: false,
      error: 'Price in cents required',
    });
  }

  const priceService = getMantlePriceOracleService();
  const result = await priceService.updatePrice(priceInCents);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get coffee price
 */
async function handleGetPrice(req: VercelRequest, res: VercelResponse) {
  try {
    const priceService = getMantlePriceOracleService();
    const priceInfo = await priceService.getPriceInfo();

    return res.status(200).json({
      success: true,
      ...priceInfo,
    });
  } catch (error: any) {
    // Return mock data when oracle is not initialized (expected during development)
    if (error.message === 'Price oracle not initialized') {
      return res.status(200).json({
        success: true,
        price: 0,
        lastUpdate: Date.now(),
        priceInCents: 0,
        note: 'Price oracle not initialized - using default values',
      });
    }
    
    console.error('Error getting price from oracle:', error.message);
    return res.status(200).json({
      success: true,
      price: 0,
      lastUpdate: Date.now(),
      priceInCents: 0,
    });
  }
}

/**
 * Send USDC payment
 */
async function handleSendPayment(req: VercelRequest, res: VercelResponse) {
  const { to, amount } = req.body;

  if (!to || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Recipient address and amount required',
    });
  }

  const paymentService = getMantlePaymentService();
  const result = await paymentService.sendUSDC(to, amount);

  return res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get price history
 */
async function handleGetPriceHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const priceHistory = await db.query.priceHistory.findMany({
      orderBy: (prices, { desc }) => [desc(prices.timestamp)],
      limit: 100,
    });

    // If no price history in database, return empty array
    return res.status(200).json({
      success: true,
      prices: priceHistory || [],
    });
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    // Return empty array instead of error for better UX
    return res.status(200).json({
      success: true,
      prices: [],
    });
  }
}

/**
 * Get market overview
 */
async function handleGetMarketOverview(req: VercelRequest, res: VercelResponse) {
  try {
    // Get total groves
    const groves = await db.query.coffeeGroves.findMany();
    const totalGroves = groves.length;
    const totalTrees = groves.reduce((sum, g) => sum + (g.treeCount || 0), 0);
    
    // Get total investments (sum of tokens sold)
    const totalInvestment = groves.reduce((sum, g) => sum + (g.tokensSold || 0), 0);
    
    // Calculate average health score
    const avgHealthScore = groves.length > 0
      ? groves.reduce((sum, g) => sum + (g.currentHealthScore || 0), 0) / groves.length
      : 0;

    return res.status(200).json({
      success: true,
      overview: {
        totalGroves,
        totalTrees,
        totalInvestment,
        averageHealthScore: Math.round(avgHealthScore),
        activeInvestors: 0, // TODO: Calculate from token holdings
        totalRevenue: 0, // TODO: Calculate from harvest records
      },
    });
  } catch (error: any) {
    console.error('Error fetching market overview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market overview',
    });
  }
}

/**
 * Get harvest history for a farmer
 */
async function handleGetHarvestHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const farmerAddress = req.query.farmerAddress as string;

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    console.log('📊 Fetching harvest history for:', farmerAddress);
    console.log('harvestRecords table:', harvestRecords ? 'defined' : 'undefined');

    // Get farmer's groves
    const farmerGroves = await db.query.coffeeGroves.findMany({
      where: eq(coffeeGroves.farmerAddress, farmerAddress),
    });

    console.log('Found groves:', farmerGroves.length);

    if (farmerGroves.length === 0) {
      return res.status(200).json({
        success: true,
        harvests: [],
      });
    }

    // Get harvests for all farmer's groves
    const groveIds = farmerGroves.map(g => g.id);
    
    const harvests = await db.select({
      id: harvestRecords.id,
      groveId: harvestRecords.groveId,
      groveName: coffeeGroves.groveName,
      yieldKg: harvestRecords.yieldKg,
      qualityGrade: harvestRecords.qualityGrade,
      harvestDate: harvestRecords.harvestDate,
      notes: harvestRecords.notes,
      revenueDistributed: harvestRecords.revenueDistributed,
    })
    .from(harvestRecords)
    .leftJoin(coffeeGroves, eq(harvestRecords.groveId, coffeeGroves.id))
    .where(eq(coffeeGroves.farmerAddress, farmerAddress))
    .orderBy(harvestRecords.harvestDate);

    console.log('Found harvests:', harvests.length);

    return res.status(200).json({
      success: true,
      harvests,
    });
  } catch (error: any) {
    console.error('Error fetching harvest history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch harvest history',
    });
  }
}

/**
 * Get harvest stats for a farmer
 */
async function handleGetHarvestStats(req: VercelRequest, res: VercelResponse) {
  try {
    const farmerAddress = req.query.farmerAddress as string;

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    // Get harvests for farmer
    
    const harvests = await db.select({
      yieldKg: harvestRecords.yieldKg,
    })
    .from(harvestRecords)
    .leftJoin(coffeeGroves, eq(harvestRecords.groveId, coffeeGroves.id))
    .where(eq(coffeeGroves.farmerAddress, farmerAddress));

    const totalHarvests = harvests.length;
    const totalYield = harvests.reduce((sum, h) => sum + (h.yieldKg || 0), 0);
    const averageYield = totalHarvests > 0 ? Math.round(totalYield / totalHarvests) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalHarvests,
        totalYield,
        totalRevenue: 0, // TODO: Calculate from revenue distributions
        averageYield,
      },
    });
  } catch (error: any) {
    console.error('Error fetching harvest stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch harvest stats',
    });
  }
}

/**
 * Report a harvest
 */
async function handleReportHarvest(req: VercelRequest, res: VercelResponse) {
  try {
    const { groveId, groveName, yieldAmount, quality, notes, farmerAddress } = req.body;

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    if (!groveId && !groveName) {
      return res.status(400).json({
        success: false,
        error: 'Grove ID or name is required',
      });
    }

    console.log('📊 Harvest reported:', { groveId, groveName, yieldAmount, quality, farmerAddress });

    // Find the grove
    let grove;
    if (groveId) {
      grove = await db.query.coffeeGroves.findFirst({
        where: eq(coffeeGroves.id, groveId),
      });
    } else if (groveName) {
      grove = await db.query.coffeeGroves.findFirst({
        where: eq(coffeeGroves.groveName, groveName),
      });
    }

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Save harvest to database
    
    const [harvest] = await db.insert(harvestRecords).values({
      groveId: grove.id,
      harvestDate: Date.now(),
      yieldKg: Math.round(parseFloat(yieldAmount) || 0),
      qualityGrade: parseInt(quality) || 5,
      notes: notes || '',
      revenueDistributed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    console.log('✅ Harvest saved to database:', harvest);

    return res.status(200).json({
      success: true,
      message: 'Harvest reported successfully',
      harvest: {
        id: harvest.id,
        groveId: harvest.groveId,
        groveName: grove.groveName,
        yieldKg: harvest.yieldKg,
        qualityGrade: harvest.qualityGrade,
        harvestDate: harvest.harvestDate,
      },
    });
  } catch (error: any) {
    console.error('Error reporting harvest:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to report harvest',
    });
  }
}

/**
 * Get farmer withdrawals
 */
async function handleGetFarmerWithdrawals(req: VercelRequest, res: VercelResponse) {
  try {
    const farmerAddress = req.url?.split('/').pop() || '';

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    // Return empty array for now
    return res.status(200).json({
      success: true,
      withdrawals: [],
      message: 'Withdrawal tracking coming soon',
    });
  } catch (error: any) {
    console.error('Error fetching farmer withdrawals:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch withdrawals',
    });
  }
}

/**
 * Get farmer balance (revenue balance)
 */
async function handleGetFarmerBalance(req: VercelRequest, res: VercelResponse) {
  try {
    const farmerAddress = req.query.farmerAddress as string;

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    // Return mock balance for now
    return res.status(200).json({
      success: true,
      farmerAddress,
      balance: {
        available: '0.00',
        pending: '0.00',
        total: '0.00',
      },
      message: 'Revenue tracking coming soon',
    });
  } catch (error: any) {
    console.error('Error fetching farmer balance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch balance',
    });
  }
}

export default handleMantleAPI;
