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
import { coffeeGroves, farmers } from '../db/schema/index.js';
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
  const groveId = parseInt(req.url?.split('/').pop() || '0');

  if (!groveId) {
    return res.status(400).json({
      success: false,
      error: 'Invalid grove ID',
    });
  }

  const tokenService = getMantleTokenizationService();
  const groveInfo = await tokenService.getGroveInfo(groveId);

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
  const priceService = getMantlePriceOracleService();
  const priceInfo = await priceService.getPriceInfo();

  return res.status(200).json({
    success: true,
    ...priceInfo,
  });
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

export default handleMantleAPI;
