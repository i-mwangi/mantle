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
import { coffeeGroves, farmers, harvestRecords, farmerWithdrawals, revenueDistributions, investorProfiles, investorWithdrawals } from '../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

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
    
    // Update grove tokenization status (after blockchain tokenization)
    if (url.includes('/groves/update-tokenization') && method === 'POST') {
      return await handleUpdateTokenization(req, res);
    }

    // Grove History: Get harvest history for a grove (must come before generic /groves/ route)
    if (url.includes('/groves/') && url.includes('/history') && method === 'GET') {
      return await handleGetGroveHistory(req, res);
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

    // Investor Balance: Get balance summary (check BEFORE generic /balance/)
    if (url.includes('/api/investor/balance/') && method === 'GET') {
      return await handleGetInvestorBalance(req, res);
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

    // Harvest: Preview distribution
    if (url.includes('/api/harvest/preview-distribution/') && method === 'GET') {
      console.log('📊 Preview distribution request received:', url);
      return await handlePreviewDistribution(req, res);
    }

    // Harvest: Confirm distribution
    if (url.includes('/api/harvest/confirm-distribution') && method === 'POST') {
      return await handleConfirmDistribution(req, res);
    }

    // Farmer: Process withdrawal (check this BEFORE withdrawals/ to avoid conflicts)
    if (url.includes('/api/farmer/withdraw') && method === 'POST') {
      return await handleFarmerWithdraw(req, res);
    }

    // Farmer: Get withdrawals
    if (url.includes('/api/farmer/withdrawals/') && method === 'GET') {
      return await handleGetFarmerWithdrawals(req, res);
    }

    // Farmer: Get transactions
    if (url.includes('/api/farmer/transactions/') && method === 'GET') {
      return await handleGetFarmerTransactions(req, res);
    }

    // Admin: Get token holders for a grove
    if (url.includes('/api/admin/token-holders') && method === 'GET') {
      return await handleGetTokenHolders(req, res);
    }

    // Revenue: Get farmer balance
    if (url.includes('/api/revenue/farmer-balance') && method === 'GET') {
      return await handleGetFarmerBalance(req, res);
    }

    // Funding: Get farmer's funding requests
    if (url.includes('/api/funding/requests/') && method === 'GET') {
      return await handleGetFundingRequests(req, res);
    }

    // Funding: Get funding pool for a grove
    if (url.includes('/api/funding/pool/') && method === 'GET') {
      return await handleGetFundingPool(req, res);
    }

    // Funding: Create new funding request
    if (url.includes('/api/funding/request') && method === 'POST') {
      return await handleCreateFundingRequest(req, res);
    }

    // Funding: Get single request details
    if (url.includes('/api/funding/request/') && method === 'GET') {
      return await handleGetFundingRequestDetails(req, res);
    }

    // Investment: Get available groves for investment
    if (url.includes('/api/investment/available-groves') && method === 'GET') {
      return await handleGetAvailableGroves(req, res);
    }

    // Investment: Get investor portfolio
    if (url.includes('/api/investment/portfolio') && method === 'GET') {
      return await handleGetInvestorPortfolio(req, res);
    }

    // Investment: Purchase tokens
    if (url.includes('/api/investment/purchase-tokens') && method === 'POST') {
      return await handlePurchaseTokens(req, res);
    }

    // Investor Earnings: Get earnings data
    if (url.includes('/api/harvest/holder/') && url.includes('/earnings') && method === 'GET') {
      return await handleGetInvestorEarnings(req, res);
    }

    // Investor Earnings: Get unclaimed earnings
    if (url.includes('/api/investor/earnings/unclaimed/') && method === 'GET') {
      return await handleGetUnclaimedEarnings(req, res);
    }

    // Investor Withdrawals: Get withdrawal history
    if (url.includes('/api/investor/withdrawals/') && method === 'GET') {
      return await handleGetInvestorWithdrawals(req, res);
    }

    // Investor Withdrawals: Process withdrawal
    if (url.includes('/api/investor/withdraw') && method === 'POST') {
      return await handleInvestorWithdraw(req, res);
    }

    // Revenue: Get pending distributions
    if (url.includes('/api/revenue/pending-distributions') && method === 'GET') {
      return await handleGetPendingDistributions(req, res);
    }

    // Revenue: Get distribution history
    if (url.includes('/api/revenue/distribution-history') && method === 'GET') {
      return await handleGetDistributionHistory(req, res);
    }

    // Marketplace: List tokens for sale (exact match to avoid conflict with /listings)
    if (url.endsWith('/api/marketplace/list') && method === 'POST') {
      return await handleListTokensForSale(req, res);
    }

    // Marketplace: Get listings
    if (url.includes('/api/marketplace/listings') && method === 'GET') {
      return await handleGetMarketplaceListings(req, res);
    }

    // Marketplace: Get trade history
    if (url.includes('/api/marketplace/trades') && method === 'GET') {
      return await handleGetTradeHistory(req, res);
    }

    // Transaction History: Get transaction history for user
    if (url.includes('/api/transactions/history') && method === 'GET') {
      return await handleGetTransactionHistory(req, res);
    }

    // Marketplace: Purchase listing
    if (url.includes('/api/marketplace/purchase/') && method === 'POST') {
      return await handlePurchaseListing(req, res);
    }

    // Marketplace: Cancel listing
    if (url.includes('/api/marketplace/cancel/') && method === 'POST') {
      return await handleCancelListing(req, res);
    }

    // Marketplace: Get listing details
    if (url.includes('/api/marketplace/listing/') && method === 'GET') {
      return await handleGetListingDetails(req, res);
    }

    // Funding History: Get funding history for a grove
    if (url.includes('/api/funding/grove/') && url.includes('/history') && method === 'GET') {
      return await handleGetGroveFundingHistory(req, res);
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
 * Update grove tokenization status (called after blockchain tokenization)
 */
async function handleUpdateTokenization(req: VercelRequest, res: VercelResponse) {
  try {
    const { groveName, tokenAddress, totalTokensIssued, transactionHash } = req.body;

    if (!groveName || !tokenAddress || !totalTokensIssued) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groveName, tokenAddress, totalTokensIssued',
      });
    }

    console.log('📝 Updating tokenization in database:', {
      groveName,
      tokenAddress,
      totalTokensIssued,
      transactionHash,
    });

    // Find the grove by name
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.groveName, groveName),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: `Grove '${groveName}' not found`,
      });
    }

    // Update the grove with tokenization info
    await db
      .update(coffeeGroves)
      .set({
        isTokenized: true,
        tokenAddress: tokenAddress,
        totalTokensIssued: parseInt(totalTokensIssued),
        tokenizedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(coffeeGroves.id, grove.id));

    console.log('✅ Grove tokenization updated in database');

    return res.status(200).json({
      success: true,
      message: 'Grove tokenization updated successfully',
      grove: {
        id: grove.id,
        groveName: grove.groveName,
        tokenAddress,
        totalTokensIssued,
      },
    });
  } catch (error: any) {
    console.error('Error updating tokenization:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tokenization',
    });
  }
}

/**
 * Get grove info
 */
async function handleGetGrove(req: VercelRequest, res: VercelResponse) {
  const groveIdentifier = req.url?.split('/groves/')[1]?.split('?')[0] || '';

  if (!groveIdentifier) {
    return res.status(400).json({
      success: false,
      error: 'Invalid grove identifier',
    });
  }

  try {
    // Check if identifier is a number (ID) or string (name)
    const isId = !isNaN(Number(groveIdentifier));
    
    let grove;
    if (isId) {
      // Query by ID
      grove = await db.query.coffeeGroves.findFirst({
        where: eq(coffeeGroves.id, Number(groveIdentifier)),
      });
    } else {
      // Query by name
      grove = await db.query.coffeeGroves.findFirst({
        where: eq(coffeeGroves.groveName, groveIdentifier),
      });
    }

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Transform to camelCase for frontend compatibility
    const groveData = {
      id: grove.id,
      groveName: grove.groveName,
      farmerAddress: grove.farmerAddress,
      tokenAddress: grove.tokenAddress,
      tokenSymbol: grove.tokenSymbol,
      location: grove.location,
      coordinatesLat: grove.coordinatesLat,
      coordinatesLng: grove.coordinatesLng,
      treeCount: grove.treeCount,
      coffeeVariety: grove.coffeeVariety,
      plantingDate: grove.plantingDate,
      expectedYieldPerTree: grove.expectedYieldPerTree,
      totalTokensIssued: grove.totalTokensIssued,
      tokensSold: grove.tokensSold,
      tokensPerTree: grove.tokensPerTree,
      verificationStatus: grove.verificationStatus,
      currentHealthScore: grove.currentHealthScore,
      isTokenized: grove.isTokenized,
      tokenizedAt: grove.tokenizedAt,
      createdAt: grove.createdAt,
      updatedAt: grove.updatedAt,
    };

    return res.status(200).json({
      success: true,
      grove: groveData,
    });
  } catch (error: any) {
    console.error('Error getting grove:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get grove',
    });
  }
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
    
    // Get unique farmers (active farmers)
    const uniqueFarmers = new Set(groves.map(g => g.farmerAddress?.toLowerCase()).filter(Boolean));
    const activeFarmers = uniqueFarmers.size;
    
    // Get total investments (sum of tokens sold * price per token)
    const totalInvestment = groves.reduce((sum, g) => sum + ((g.tokensSold || 0) * 10), 0); // $10 per token
    
    // Calculate total revenue from harvest records
    let totalRevenue = 0;
    try {
      const harvests = await db.query.harvestRecords.findMany();
      totalRevenue = harvests.reduce((sum, h) => sum + (h.totalRevenue || 0), 0);
    } catch (error) {
      console.log('⚠️  harvest_records table not found, totalRevenue = 0');
    }
    
    // Calculate average health score
    const avgHealthScore = groves.length > 0
      ? groves.reduce((sum, g) => sum + (g.currentHealthScore || 0), 0) / groves.length
      : 0;

    // Count active investors (unique token holders)
    let activeInvestors = 0;
    try {
      const { createClient } = await import('@libsql/client');
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL || 'file:local.db',
        authToken: process.env.TURSO_AUTH_TOKEN
      });
      
      // This would require querying blockchain for all token holders
      // For now, we'll estimate based on marketplace activity
      const result = await client.execute({
        sql: `SELECT COUNT(DISTINCT seller_address) as count FROM marketplace_listings`,
        args: []
      });
      activeInvestors = Number(result.rows[0]?.count || 0);
    } catch (error) {
      console.log('⚠️  Could not count active investors');
    }

    return res.status(200).json({
      success: true,
      totalGroves,
      activeFarmers,
      totalRevenue,
      totalTrees,
      totalInvestment,
      averageHealthScore: Math.round(avgHealthScore),
      activeInvestors,
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
      tokenAddress: coffeeGroves.tokenAddress,
      yieldKg: harvestRecords.yieldKg,
      qualityGrade: harvestRecords.qualityGrade,
      harvestDate: harvestRecords.harvestDate,
      totalRevenue: harvestRecords.totalRevenue,
      farmerShare: harvestRecords.farmerShare,
      investorShare: harvestRecords.investorShare,
      revenueDistributed: harvestRecords.revenueDistributed,
      transactionHash: harvestRecords.transactionHash,
      createdAt: harvestRecords.createdAt,
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
    const { 
      groveId, 
      groveName, 
      yieldKg,
      qualityGrade,
      salePricePerKg,
      harvestDate,
      coffeeVariety,
      farmerAddress,
      // Legacy field names for backwards compatibility
      yieldAmount,
      quality
    } = req.body;

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

    // Use new field names, fallback to legacy names
    const finalYieldKg = yieldKg || yieldAmount;
    const finalQualityGrade = qualityGrade || quality;
    const finalSalePricePerKg = salePricePerKg || 0;
    const finalHarvestDate = harvestDate ? new Date(harvestDate).getTime() : Date.now();

    console.log('📊 Harvest reported:', { 
      groveId, 
      groveName, 
      yieldKg: finalYieldKg, 
      qualityGrade: finalQualityGrade,
      salePricePerKg: finalSalePricePerKg,
      harvestDate: finalHarvestDate,
      coffeeVariety,
      farmerAddress 
    });

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

    // Calculate revenue and shares
    const yieldKgValue = parseFloat(finalYieldKg) || 0;
    const pricePerKg = parseFloat(finalSalePricePerKg) || 0;
    const totalRevenue = yieldKgValue * pricePerKg;
    const farmerShare = totalRevenue * 0.3; // 30% to farmer
    const investorShare = totalRevenue * 0.7; // 70% to investors

    // Save harvest to database
    const [harvest] = await db.insert(harvestRecords).values({
      groveId: grove.id,
      harvestDate: finalHarvestDate,
      yieldKg: Math.round(yieldKgValue),
      qualityGrade: parseInt(finalQualityGrade) || 5,
      salePricePerKg: pricePerKg,
      totalRevenue: totalRevenue,
      farmerShare: farmerShare,
      investorShare: investorShare,
      revenueDistributed: false,
      transactionHash: null,
    }).returning();

    console.log('✅ Harvest saved to database:', harvest);
    console.log('📝 Note: Revenue distribution must be triggered manually via "Distribute Revenue" button');

    return res.status(200).json({
      success: true,
      message: 'Harvest reported successfully',
      harvest: {
        id: harvest.id,
        groveId: harvest.groveId,
        groveName: grove.groveName,
        yieldKg: harvest.yieldKg,
        qualityGrade: harvest.qualityGrade,
        salePricePerKg: harvest.salePricePerKg,
        totalRevenue: harvest.totalRevenue,
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

    console.log('📊 Fetching withdrawals for farmer:', farmerAddress);

    // Get withdrawals with grove names
    const withdrawals = await db.select({
      id: farmerWithdrawals.id,
      farmerAddress: farmerWithdrawals.farmerAddress,
      groveId: farmerWithdrawals.groveId,
      groveName: coffeeGroves.groveName,
      amount: farmerWithdrawals.amount,
      status: farmerWithdrawals.status,
      transactionHash: farmerWithdrawals.transactionHash,
      blockExplorerUrl: farmerWithdrawals.blockExplorerUrl,
      errorMessage: farmerWithdrawals.errorMessage,
      requestedAt: farmerWithdrawals.requestedAt,
      completedAt: farmerWithdrawals.completedAt,
    })
    .from(farmerWithdrawals)
    .leftJoin(coffeeGroves, eq(farmerWithdrawals.groveId, coffeeGroves.id))
    .where(eq(farmerWithdrawals.farmerAddress, farmerAddress))
    .orderBy(desc(farmerWithdrawals.requestedAt));

    console.log('📊 Found', withdrawals.length, 'withdrawals');

    return res.status(200).json({
      success: true,
      withdrawals: withdrawals,
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

    console.log('📊 Calculating farmer balance for:', farmerAddress);

    // Get farmer's groves
    const farmerGroves = await db.query.coffeeGroves.findMany({
      where: eq(coffeeGroves.farmerAddress, farmerAddress),
    });

    if (farmerGroves.length === 0) {
      return res.status(200).json({
        success: true,
        farmerAddress,
        availableBalance: 0,
        pendingDistribution: 0,
        totalDistributed: 0,
        totalWithdrawn: 0,
        thisMonthDistribution: 0,
        groveBalances: [],
      });
    }

    const groveIds = farmerGroves.map(g => g.id);

    // Get all harvests for farmer's groves
    const allHarvests = await db.select()
      .from(harvestRecords)
      .where(eq(harvestRecords.groveId, groveIds[0])); // Start with first grove

    // Get harvests for all groves (if multiple)
    let harvests = allHarvests;
    if (groveIds.length > 1) {
      for (let i = 1; i < groveIds.length; i++) {
        const moreHarvests = await db.select()
          .from(harvestRecords)
          .where(eq(harvestRecords.groveId, groveIds[i]));
        harvests = [...harvests, ...moreHarvests];
      }
    }

    console.log('📊 Found', harvests.length, 'harvests for farmer');

    // Calculate balances
    let totalDistributed = 0;
    let pendingDistribution = 0;
    let thisMonthDistribution = 0;

    const now = Date.now();
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    for (const harvest of harvests) {
      const farmerShare = harvest.farmerShare || 0;
      
      if (harvest.revenueDistributed) {
        totalDistributed += farmerShare;
        
        // Check if distributed this month
        const harvestDate = typeof harvest.harvestDate === 'number' 
          ? harvest.harvestDate 
          : new Date(harvest.harvestDate).getTime();
        
        if (harvestDate >= thisMonthStart) {
          thisMonthDistribution += farmerShare;
        }
      } else {
        pendingDistribution += farmerShare;
      }
    }

    // Calculate total withdrawn from completed withdrawals
    const withdrawals = await db.select()
      .from(farmerWithdrawals)
      .where(eq(farmerWithdrawals.farmerAddress, farmerAddress));
    
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Available balance = total distributed - total withdrawn
    const availableBalance = totalDistributed - totalWithdrawn;

    // Calculate per-grove balances (with withdrawals subtracted)
    const groveBalances = [];
    for (const grove of farmerGroves) {
      const groveHarvests = harvests.filter(h => h.groveId === grove.id);
      let groveDistributed = 0;
      
      for (const harvest of groveHarvests) {
        if (harvest.revenueDistributed) {
          groveDistributed += harvest.farmerShare || 0;
        }
      }
      
      // Subtract withdrawals for this specific grove
      const groveWithdrawals = withdrawals
        .filter(w => w.status === 'completed' && w.groveId === grove.id)
        .reduce((sum, w) => sum + (w.amount || 0), 0);
      
      const groveAvailable = groveDistributed - groveWithdrawals;
      
      if (groveAvailable > 0) {
        groveBalances.push({
          groveId: grove.id,
          groveName: grove.groveName,
          availableBalance: groveAvailable,
        });
      }
    }

    console.log('📊 Farmer balance calculated:', {
      availableBalance,
      pendingDistribution,
      totalDistributed,
      thisMonthDistribution,
      groveBalances: groveBalances.length,
    });

    return res.status(200).json({
      success: true,
      farmerAddress,
      availableBalance,
      pendingDistribution,
      totalDistributed,
      totalWithdrawn,
      thisMonthDistribution,
      groveBalances,
    });
  } catch (error: any) {
    console.error('Error fetching farmer balance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch balance',
    });
  }
}

/**
 * Handle farmer withdrawal with blockchain integration
 */
async function handleFarmerWithdraw(req: VercelRequest, res: VercelResponse) {
  try {
    const { farmerAddress, groveId, amount } = req.body;

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid withdrawal amount is required',
      });
    }

    console.log(' Processing farmer withdrawal:', { farmerAddress, groveId, amount });

    // Validate that farmer has sufficient balance
    const farmerGroves = await db.query.coffeeGroves.findMany({
      where: eq(coffeeGroves.farmerAddress, farmerAddress),
    });

    if (farmerGroves.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No groves found for this farmer',
      });
    }

    // If groveId specified, validate it belongs to farmer
    let targetGrove = null;
    if (groveId) {
      targetGrove = farmerGroves.find(g => g.id === parseInt(groveId));
      if (!targetGrove) {
        return res.status(403).json({
          success: false,
          error: 'Grove does not belong to this farmer',
        });
      }
    }

    // Calculate available balance
    const groveIds = groveId ? [parseInt(groveId)] : farmerGroves.map(g => g.id);
    
    let totalAvailable = 0;
    for (const gId of groveIds) {
      const groveHarvests = await db.select()
        .from(harvestRecords)
        .where(eq(harvestRecords.groveId, gId));
      
      for (const harvest of groveHarvests) {
        if (harvest.revenueDistributed) {
          totalAvailable += harvest.farmerShare || 0;
        }
      }
    }

    // Subtract previous withdrawals
    const previousWithdrawals = await db.select()
      .from(farmerWithdrawals)
      .where(eq(farmerWithdrawals.farmerAddress, farmerAddress));
    
    const totalWithdrawn = previousWithdrawals
      .filter(w => w.status === 'completed')
      .filter(w => !groveId || w.groveId === parseInt(groveId)) // Only count withdrawals for this grove
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    
    const availableBalance = totalAvailable - totalWithdrawn;

    console.log(' Balance calculation:', {
      groveIds,
      totalAvailable,
      totalWithdrawn,
      availableBalance,
      requestedAmount: amount
    });

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
      });
    }

    // Create withdrawal record
    const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [withdrawal] = await db.insert(farmerWithdrawals).values({
      id: withdrawalId,
      farmerAddress,
      groveId: groveId || null,
      amount,
      status: 'pending',
      requestedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    console.log('✅ Withdrawal record created:', withdrawalId);

    // Implement blockchain transaction
    try {
      console.log('🔗 Initiating blockchain withdrawal...');
      
      // Import ethers
      const { ethers } = await import('ethers');
      const { REVENUE_RESERVE_ABI } = await import('../lib/api/contract-abis.js');
      
      // Get contract address from environment
      const revenueReserveAddress = process.env.MANTLE_REVENUE_RESERVE_ADDRESS;
      if (!revenueReserveAddress) {
        throw new Error('MANTLE_REVENUE_RESERVE_ADDRESS not configured in environment');
      }
      
      // Create provider and signer
      const rpcUrl = process.env.MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
      const privateKey = process.env.PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error('PRIVATE_KEY not configured in environment');
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);
      
      console.log('🔗 Connected to Mantle network:', rpcUrl);
      console.log('🔗 Using signer address:', await signer.getAddress());
      
      // Create contract instance
      const revenueReserveContract = new ethers.Contract(
        revenueReserveAddress,
        REVENUE_RESERVE_ABI,
        signer
      );
      
      // Convert amount to USDC units (6 decimals)
      const amountInUSDC = ethers.parseUnits(amount.toString(), 6);
      
      console.log('🔗 Calling withdrawFarmerShare:', {
        amount: amountInUSDC.toString(),
        recipient: farmerAddress,
      });
      
      // Call withdrawFarmerShare on contract
      const tx = await revenueReserveContract.withdrawFarmerShare(
        amountInUSDC,
        farmerAddress
      );
      
      console.log('🔗 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Update withdrawal record with real transaction hash
      const explorerUrl = `https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`;
      
      await db.update(farmerWithdrawals)
        .set({
          status: 'completed',
          transactionHash: tx.hash,
          blockExplorerUrl: explorerUrl,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(farmerWithdrawals.id, withdrawalId));

      console.log('✅ Withdrawal completed successfully');

      return res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully',
        withdrawal: {
          id: withdrawalId,
          farmerAddress,
          groveId: groveId || null,
          amount,
          status: 'completed',
          transactionHash: tx.hash,
          blockExplorerUrl: explorerUrl,
          requestedAt: withdrawal.requestedAt,
          completedAt: Date.now(),
        },
      });
    } catch (blockchainError: any) {
      console.error('❌ Blockchain transaction failed:', blockchainError);
      
      // Update withdrawal record to failed status
      await db.update(farmerWithdrawals)
        .set({
          status: 'failed',
          errorMessage: blockchainError.message || 'Blockchain transaction failed',
          updatedAt: Date.now(),
        })
        .where(eq(farmerWithdrawals.id, withdrawalId));
      
      return res.status(500).json({
        success: false,
        error: `Blockchain transaction failed: ${blockchainError.message}`,
        withdrawalId,
      });
    }
  } catch (error: any) {
    console.error('Error processing farmer withdrawal:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal',
    });
  }
}

/**
 * Get investor earnings data
 */
async function handleGetInvestorEarnings(req: VercelRequest, res: VercelResponse) {
  try {
    const holderAddress = req.url?.split('/holder/')[1]?.split('/earnings')[0];
    
    if (!holderAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing holder address',
      });
    }

    console.log('📊 Getting earnings for holder:', holderAddress);

    try {
      // Get all revenue distributions for this holder
      const distributions = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, holderAddress),
        orderBy: [desc(revenueDistributions.distributionDate)],
      });

      const totalEarnings = distributions.reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);
      const pendingEarnings = distributions
        .filter(d => d.paymentStatus === 'pending')
        .reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          totalEarnings,
          pendingEarnings,
          paidEarnings: totalEarnings - pendingEarnings,
          distributionCount: distributions.length,
          distributions: distributions.slice(0, 10), // Last 10
        },
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty data
      console.log('⚠️  revenue_distributions table not found, returning empty data');
      return res.status(200).json({
        success: true,
        data: {
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          distributionCount: 0,
          distributions: [],
        },
      });
    }
  } catch (error: any) {
    console.error('Error getting investor earnings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get earnings',
    });
  }
}

/**
 * Get investor withdrawal history
 */
async function handleGetInvestorWithdrawals(req: VercelRequest, res: VercelResponse) {
  try {
    const investorAddress = req.url?.split('/withdrawals/')[1]?.split('?')[0];
    
    if (!investorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing investor address',
      });
    }

    console.log('📊 Getting withdrawals for investor:', investorAddress);

    try {
      // Query investor_withdrawals table
      const withdrawals = await db.query.investorWithdrawals.findMany({
        where: eq(investorWithdrawals.investorAddress, investorAddress.toLowerCase()),
        orderBy: [desc(investorWithdrawals.requestedAt)],
      });

      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      const pendingWithdrawals = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          withdrawals,
          totalWithdrawn,
          pendingWithdrawals,
        },
      });
    } catch (dbError: any) {
      console.log('⚠️  Drizzle query failed, trying raw SQL:', dbError.message);
      
      // Fallback to raw SQL
      try {
        const { createClient } = await import('@libsql/client');
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL || 'file:local.db',
          authToken: process.env.TURSO_AUTH_TOKEN
        });
        
        const result = await client.execute({
          sql: 'SELECT * FROM investor_withdrawals WHERE investor_address = ? ORDER BY requested_at DESC',
          args: [investorAddress.toLowerCase()]
        });
        
        const withdrawals = result.rows.map((row: any) => ({
          id: row.id,
          investorAddress: row.investor_address,
          amount: row.amount,
          status: row.status,
          transactionHash: row.transaction_hash,
          blockExplorerUrl: row.block_explorer_url,
          requestedAt: row.requested_at,
          completedAt: row.completed_at,
        }));
        
        const totalWithdrawn = withdrawals
          .filter((w: any) => w.status === 'completed')
          .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

        const pendingWithdrawals = withdrawals
          .filter((w: any) => w.status === 'pending')
          .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
        
        console.log(`📊 Raw SQL found ${withdrawals.length} withdrawals`);
        client.close();

        return res.status(200).json({
          success: true,
          data: {
            withdrawals,
            totalWithdrawn,
            pendingWithdrawals,
          },
        });
      } catch (sqlError: any) {
        console.error('❌ Raw SQL also failed:', sqlError.message);
        return res.status(200).json({
          success: true,
          data: {
            withdrawals: [],
            totalWithdrawn: 0,
            pendingWithdrawals: 0,
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Error getting investor withdrawals:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get withdrawals',
    });
  }
}

/**
 * Get investor balance summary
 */
async function handleGetInvestorBalance(req: VercelRequest, res: VercelResponse) {
  try {
    const investorAddress = req.url?.split('/balance/')[1]?.split('?')[0];
    
    if (!investorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing investor address',
      });
    }

    console.log('📊 Getting balance for investor:', investorAddress);

    try {
      // Get all revenue distributions for this investor
      const distributions = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, investorAddress.toLowerCase()),
        orderBy: [desc(revenueDistributions.distributionDate)],
      });

      // Calculate totals (values are in cents in database)
      const totalEarned = distributions.reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);
      const totalClaimed = distributions
        .filter(d => d.paymentStatus === 'completed')
        .reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);
      const totalUnclaimed = distributions
        .filter(d => d.paymentStatus === 'pending' || !d.paymentStatus)
        .reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);

      // Get withdrawals (if table exists)
      let totalWithdrawn = 0;
      try {
        const withdrawals = await db.query.investorWithdrawals.findMany({
          where: eq(investorWithdrawals.investorAddress, investorAddress.toLowerCase()),
        });
        totalWithdrawn = withdrawals
          .filter(w => w.status === 'completed')
          .reduce((sum, w) => sum + (w.amount || 0), 0);
        
        console.log(`📊 Found ${withdrawals.length} withdrawals, total: $${totalWithdrawn}`);
      } catch (e: any) {
        console.log('⚠️  Drizzle query failed, trying raw SQL:', e.message);
        
        // Fallback to raw SQL query
        try {
          const { createClient } = await import('@libsql/client');
          const client = createClient({
            url: process.env.TURSO_DATABASE_URL || 'file:local.db',
            authToken: process.env.TURSO_AUTH_TOKEN
          });
          
          const result = await client.execute({
            sql: 'SELECT * FROM investor_withdrawals WHERE investor_address = ? AND status = ?',
            args: [investorAddress.toLowerCase(), 'completed']
          });
          
          totalWithdrawn = result.rows.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
          console.log(`📊 Raw SQL found ${result.rows.length} withdrawals, total: $${totalWithdrawn}`);
          
          client.close();
        } catch (sqlError: any) {
          console.error('❌ Raw SQL also failed:', sqlError.message);
        }
      }

      const availableBalance = totalEarned - totalWithdrawn;

      // Calculate this month's earnings
      const now = Date.now();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const totalEarningsThisMonth = distributions
        .filter(d => d.distributionDate >= startOfMonth)
        .reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);

      // For now, all unclaimed earnings are from primary market
      // TODO: Add secondary market and LP interest tracking
      const balance = {
        totalEarned,
        totalWithdrawn,
        availableBalance,
        totalEarningsThisMonth,
        totalClaimed,
        unclaimedPrimaryMarket: totalUnclaimed,
        unclaimedSecondaryMarket: 0,
        unclaimedLpInterest: 0,
        totalUnclaimed,
      };

      console.log('📊 Investor balance:', balance);

      return res.status(200).json({
        success: true,
        balance,
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty data
      console.log('⚠️  revenue_distributions table not found, returning empty balance');
      return res.status(200).json({
        success: true,
        balance: {
          totalEarned: 0,
          totalWithdrawn: 0,
          availableBalance: 0,
          totalEarningsThisMonth: 0,
          totalClaimed: 0,
          unclaimedPrimaryMarket: 0,
          unclaimedSecondaryMarket: 0,
          unclaimedLpInterest: 0,
          totalUnclaimed: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Error getting investor balance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get balance',
    });
  }
}

/**
 * Process investor withdrawal
 */
async function handleInvestorWithdraw(req: VercelRequest, res: VercelResponse) {
  try {
    const { investorAddress, amount } = req.body;

    if (!investorAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Investor address and amount are required',
      });
    }

    console.log('💰 Processing investor withdrawal:', { investorAddress, amount });

    // Get investor's available balance
    try {
      const distributions = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, investorAddress.toLowerCase()),
      });

      const totalEarned = distributions.reduce((sum, dist) => sum + (dist.revenueShare || 0), 0);

      // Get previous withdrawals
      let totalWithdrawn = 0;
      try {
        const withdrawals = await db.query.investorWithdrawals.findMany({
          where: eq(investorWithdrawals.investorAddress, investorAddress.toLowerCase()),
        });
        totalWithdrawn = withdrawals
          .filter(w => w.status === 'completed')
          .reduce((sum, w) => sum + (w.amount || 0), 0);
      } catch (e) {
        console.log('⚠️  No previous withdrawals found');
      }

      const availableBalance = totalEarned - totalWithdrawn;

      if (amount > availableBalance) {
        return res.status(400).json({
          success: false,
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
        });
      }

      // Create withdrawal record
      const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(investorWithdrawals).values({
        id: withdrawalId,
        investorAddress: investorAddress.toLowerCase(),
        amount: amount,
        status: 'pending',
        requestedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      console.log('✅ Withdrawal request created:', withdrawalId);

      // Process actual USDC transfer to investor wallet
      console.log('💸 Transferring USDC to investor wallet...');
      
      try {
        const paymentService = getMantlePaymentService();
        // Convert amount to string for ethers.js parseUnits
        const transferResult = await paymentService.sendUSDC(investorAddress, amount.toString());

        if (!transferResult.success) {
          // Mark withdrawal as failed
          await db.update(investorWithdrawals)
            .set({
              status: 'failed',
              errorMessage: transferResult.error || 'USDC transfer failed',
              updatedAt: Date.now(),
            })
            .where(eq(investorWithdrawals.id, withdrawalId));

          return res.status(400).json({
            success: false,
            error: transferResult.error || 'Failed to transfer USDC',
          });
        }

        console.log('✅ USDC transferred successfully:', transferResult.transactionHash);

        // Mark withdrawal as completed with real transaction hash
        await db.update(investorWithdrawals)
          .set({
            status: 'completed',
            completedAt: Date.now(),
            transactionHash: transferResult.transactionHash,
            blockExplorerUrl: `https://explorer.sepolia.mantle.xyz/tx/${transferResult.transactionHash}`,
            updatedAt: Date.now(),
          })
          .where(eq(investorWithdrawals.id, withdrawalId));

        return res.status(200).json({
          success: true,
          message: 'Withdrawal processed successfully',
          withdrawal: {
            id: withdrawalId,
            amount,
            status: 'completed',
            transactionHash: transferResult.transactionHash,
            blockExplorerUrl: `https://explorer.sepolia.mantle.xyz/tx/${transferResult.transactionHash}`,
          },
        });
      } catch (transferError: any) {
        console.error('❌ USDC transfer error:', transferError);
        
        // Mark withdrawal as failed
        await db.update(investorWithdrawals)
          .set({
            status: 'failed',
            errorMessage: transferError.message || 'USDC transfer failed',
            updatedAt: Date.now(),
          })
          .where(eq(investorWithdrawals.id, withdrawalId));

        return res.status(500).json({
          success: false,
          error: transferError.message || 'Failed to transfer USDC',
        });
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process withdrawal',
      });
    }
  } catch (error: any) {
    console.error('Error processing investor withdrawal:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal',
    });
  }
}

/**
 * Get pending revenue distributions
 */
async function handleGetPendingDistributions(req: VercelRequest, res: VercelResponse) {
  try {
    const holderAddress = req.query?.holderAddress as string;
    
    if (!holderAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing holderAddress parameter',
      });
    }

    console.log('📊 Getting pending distributions for:', holderAddress);

    try {
      const pending = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, holderAddress),
        orderBy: [desc(revenueDistributions.distributionDate)],
      });

      const pendingDistributions = pending.filter(d => d.paymentStatus === 'pending');
      const totalPending = pendingDistributions.reduce((sum, d) => sum + (d.revenueShare || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          distributions: pendingDistributions,
          totalPending,
          count: pendingDistributions.length,
        },
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty data
      console.log('⚠️  revenue_distributions table not found, returning empty data');
      return res.status(200).json({
        success: true,
        data: {
          distributions: [],
          totalPending: 0,
          count: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Error getting pending distributions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending distributions',
    });
  }
}

/**
 * Get distribution history
 */
async function handleGetDistributionHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const holderAddress = req.query?.holderAddress as string;
    
    if (!holderAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing holderAddress parameter',
      });
    }

    console.log('📊 Getting distribution history for:', holderAddress);

    try {
      const history = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, holderAddress),
        orderBy: [desc(revenueDistributions.distributionDate)],
      });

      const completedDistributions = history.filter(d => d.paymentStatus === 'completed');
      const totalPaid = completedDistributions.reduce((sum, d) => sum + (d.revenueShare || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          distributions: completedDistributions,
          totalPaid,
          count: completedDistributions.length,
        },
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty data
      console.log('⚠️  revenue_distributions table not found, returning empty data');
      return res.status(200).json({
        success: true,
        data: {
          distributions: [],
          totalPaid: 0,
          count: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Error getting distribution history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get distribution history',
    });
  }
}

/**
 * Get marketplace listings (secondary market)
 */
async function handleGetMarketplaceListings(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('📊 Getting marketplace listings');

    // Get active listings that haven't expired
    const now = Date.now();
    
    // Use raw SQL via client
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    const result = await client.execute({
      sql: `SELECT 
              ml.*,
              cg.coffee_variety,
              cg.location,
              cg.current_health_score
            FROM marketplace_listings ml
            LEFT JOIN coffee_groves cg ON ml.grove_id = cg.id
            WHERE ml.status = 'active' AND ml.expires_at > ?
            ORDER BY ml.created_at DESC`,
      args: [now]
    });

    const listings = result.rows.map((row: any) => ({
      id: row.id,
      sellerAddress: row.seller_address,
      groveId: row.grove_id,
      tokenAddress: row.token_address,
      groveName: row.grove_name,
      tokenAmount: row.token_amount,
      pricePerToken: row.price_per_token,
      totalValue: row.total_value,
      durationDays: row.duration_days,
      expiresAt: row.expires_at,
      status: row.status,
      createdAt: row.created_at,
      listingDate: row.created_at, // Alias for frontend compatibility
      coffeeVariety: row.coffee_variety,
      location: row.location,
      healthScore: row.current_health_score,
      originalPrice: row.price_per_token, // For now, same as current price
    }));

    console.log(`✅ Found ${listings.length} active listings`);

    return res.status(200).json({
      success: true,
      listings,
      totalListings: listings.length,
    });
  } catch (error: any) {
    console.error('Error getting marketplace listings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get marketplace listings',
    });
  }
}

/**
 * Get trade history
 */
async function handleGetTradeHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const userAddress = req.url?.split('/trades/')[1]?.split('?')[0];
    
    console.log('📊 Getting trade history for:', userAddress || 'all users');

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    let result;
    if (userAddress) {
      // Get trades for specific user (as buyer or seller)
      result = await client.execute({
        sql: `SELECT * FROM marketplace_listings 
              WHERE (seller_address = ? OR buyer_address = ?) AND status = 'sold'
              ORDER BY sold_at DESC`,
        args: [userAddress, userAddress]
      });
    } else {
      // Get all completed trades
      result = await client.execute({
        sql: `SELECT * FROM marketplace_listings 
              WHERE status = 'sold'
              ORDER BY sold_at DESC
              LIMIT 100`,
        args: []
      });
    }

    const trades = result.rows.map((row: any) => ({
      id: row.id,
      sellerAddress: row.seller_address,
      buyerAddress: row.buyer_address,
      groveId: row.grove_id,
      tokenAddress: row.token_address,
      groveName: row.grove_name,
      tokenAmount: row.token_amount,
      pricePerToken: row.price_per_token,
      totalValue: row.total_value,
      soldAt: row.sold_at,
      transactionHash: row.transaction_hash,
    }));

    console.log(`✅ Found ${trades.length} trades`);

    return res.status(200).json({
      success: true,
      trades,
      count: trades.length,
    });
  } catch (error: any) {
    console.error('Error getting trade history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade history',
    });
  }
}

/**
 * Get transaction history for user
 */
async function handleGetTransactionHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const userAddress = req.query.userAddress as string;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required',
      });
    }

    console.log('📊 Getting transaction history for:', userAddress);

    // For now, return marketplace trades as transactions
    // In the future, this could include token purchases, earnings claims, etc.
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Get marketplace trades
    const tradesResult = await client.execute({
      sql: `SELECT * FROM marketplace_listings 
            WHERE (seller_address = ? OR buyer_address = ?) AND status = 'sold'
            ORDER BY sold_at DESC
            LIMIT 50`,
      args: [userAddress, userAddress]
    });

    const transactions = tradesResult.rows.map((row: any) => {
      const isSeller = row.seller_address.toLowerCase() === userAddress.toLowerCase();
      return {
        id: `trade-${row.id}`,
        type: isSeller ? 'sell' : 'buy',
        timestamp: row.sold_at,
        groveName: row.grove_name,
        tokenAmount: row.token_amount,
        pricePerToken: row.price_per_token,
        totalValue: row.total_value,
        counterparty: isSeller ? row.buyer_address : row.seller_address,
        transactionHash: row.transaction_hash,
        status: 'completed',
      };
    });

    console.log(`✅ Found ${transactions.length} transactions`);

    return res.status(200).json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    console.error('Error getting transaction history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transaction history',
      transactions: [],
      count: 0,
    });
  }
}

/**
 * Get listing details
 */
async function handleGetListingDetails(req: VercelRequest, res: VercelResponse) {
  try {
    const listingId = req.url?.split('/listing/')[1]?.split('?')[0];
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID is required',
      });
    }

    console.log('📊 Getting listing details for:', listingId);

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    const result = await client.execute({
      sql: `SELECT 
              ml.*,
              cg.coffee_variety,
              cg.location,
              cg.current_health_score,
              cg.tree_count,
              cg.expected_yield_per_tree
            FROM marketplace_listings ml
            LEFT JOIN coffee_groves cg ON ml.grove_id = cg.id
            WHERE ml.id = ?`,
      args: [listingId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found',
      });
    }

    const row = result.rows[0];
    const listing = {
      id: row.id,
      sellerAddress: row.seller_address,
      groveId: row.grove_id,
      tokenAddress: row.token_address,
      groveName: row.grove_name,
      tokenAmount: row.token_amount,
      pricePerToken: row.price_per_token,
      totalValue: row.total_value,
      durationDays: row.duration_days,
      expiresAt: row.expires_at,
      status: row.status,
      createdAt: row.created_at,
      listingDate: row.created_at,
      coffeeVariety: row.coffee_variety,
      location: row.location,
      healthScore: row.current_health_score,
      treeCount: row.tree_count,
      expectedYieldPerTree: row.expected_yield_per_tree,
      originalPrice: row.price_per_token,
    };

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Error getting listing details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get listing details',
    });
  }
}

/**
 * Purchase listing from marketplace
 */
async function handlePurchaseListing(req: VercelRequest, res: VercelResponse) {
  try {
    const listingId = req.url?.split('/purchase/')[1]?.split('?')[0];
    const { buyerAddress } = req.body;

    if (!listingId || !buyerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID and buyer address are required',
      });
    }

    console.log(' Processing marketplace purchase:', { listingId, buyerAddress });

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Get listing details
    const listingResult = await client.execute({
      sql: 'SELECT * FROM marketplace_listings WHERE id = ? AND status = \'active\'',
      args: [listingId]
    });

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found or no longer active',
      });
    }

    const listing = listingResult.rows[0];

    // Check if listing has expired
    if (Number(listing.expires_at) < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Listing has expired',
      });
    }

    // Can't buy your own listing
    if (listing.seller_address === buyerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Cannot purchase your own listing',
      });
    }

    // Update listing status to sold
    const now = Date.now();
    await client.execute({
      sql: `UPDATE marketplace_listings 
            SET status = 'sold', buyer_address = ?, sold_at = ?, updated_at = ?
            WHERE id = ?`,
      args: [buyerAddress, now, now, listingId]
    });

    console.log('✅ Listing marked as sold');

    return res.status(200).json({
      success: true,
      message: 'Purchase successful',
      listing: {
        id: listing.id,
        sellerAddress: listing.seller_address,
        buyerAddress,
        tokenAmount: listing.token_amount,
        pricePerToken: listing.price_per_token,
        totalValue: listing.total_value,
        soldAt: now,
      },
    });
  } catch (error: any) {
    console.error('Error purchasing listing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to purchase listing',
    });
  }
}

/**
 * Cancel marketplace listing
 */
async function handleCancelListing(req: VercelRequest, res: VercelResponse) {
  try {
    const listingId = req.url?.split('/cancel/')[1]?.split('?')[0];
    const { sellerAddress } = req.body;

    if (!listingId || !sellerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID and seller address are required',
      });
    }

    console.log('❌ Cancelling listing:', { listingId, sellerAddress });

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Get listing details
    const listingResult = await client.execute({
      sql: 'SELECT * FROM marketplace_listings WHERE id = ?',
      args: [listingId]
    });

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found',
      });
    }

    const listing = listingResult.rows[0];

    // Verify seller
    if (listing.seller_address !== sellerAddress) {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can cancel this listing',
      });
    }

    // Can only cancel active listings
    if (listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel active listings',
      });
    }

    // Update listing status to cancelled
    await client.execute({
      sql: `UPDATE marketplace_listings 
            SET status = 'cancelled', updated_at = ?
            WHERE id = ?`,
      args: [Date.now(), listingId]
    });

    console.log('✅ Listing cancelled');

    return res.status(200).json({
      success: true,
      message: 'Listing cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling listing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel listing',
    });
  }
}

/**
 * List tokens for sale on secondary market
 */
async function handleListTokensForSale(req: VercelRequest, res: VercelResponse) {
  try {
    const { sellerAddress, tokenAddress, groveName, tokenAmount, pricePerToken, durationDays } = req.body;

    console.log('📝 Listing tokens for sale - Full request body:', req.body);
    console.log('📝 Extracted values:', {
      sellerAddress,
      tokenAddress,
      groveName,
      tokenAmount,
      pricePerToken,
      durationDays,
    });

    // Validate required fields
    if (!sellerAddress || !tokenAddress || !groveName || !tokenAmount || !pricePerToken) {
      console.error('❌ Missing required fields:', {
        hasSellerAddress: !!sellerAddress,
        hasTokenAddress: !!tokenAddress,
        hasGroveName: !!groveName,
        hasTokenAmount: !!tokenAmount,
        hasPricePerToken: !!pricePerToken,
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate amounts
    if (tokenAmount <= 0 || pricePerToken <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Token amount and price must be greater than 0',
      });
    }

    // Get grove ID from grove name
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.groveName, groveName),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Calculate expiration
    const duration = durationDays || 30;
    const expiresAt = Date.now() + (duration * 24 * 60 * 60 * 1000);
    const totalValue = tokenAmount * pricePerToken;
    const now = Date.now();

    // Use raw SQL via run method (compatible with Turso)
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    const result = await client.execute({
      sql: `INSERT INTO marketplace_listings 
            (seller_address, grove_id, token_address, grove_name, token_amount, price_per_token, total_value, duration_days, expires_at, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      args: [sellerAddress, grove.id, tokenAddress, groveName, tokenAmount, pricePerToken, totalValue, duration, expiresAt, now, now]
    });

    console.log('✅ Listing created successfully');

    return res.status(200).json({
      success: true,
      message: 'Tokens listed for sale successfully',
      listing: {
        id: Number(result.lastInsertRowid),
        sellerAddress,
        tokenAddress,
        groveName,
        tokenAmount,
        pricePerToken,
        totalValue,
        durationDays: duration,
        expiresAt,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('Error listing tokens for sale:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to list tokens for sale',
    });
  }
}

/**
 * Get unclaimed earnings for investor
 */
async function handleGetUnclaimedEarnings(req: VercelRequest, res: VercelResponse) {
  try {
    const investorAddress = req.url?.split('/unclaimed/')[1]?.split('?')[0];
    
    if (!investorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing investor address',
      });
    }

    console.log('📊 Getting unclaimed earnings for:', investorAddress);

    try {
      // Get pending distributions
      const pending = await db.query.revenueDistributions.findMany({
        where: eq(revenueDistributions.holderAddress, investorAddress),
        orderBy: [desc(revenueDistributions.distributionDate)],
      });

      const unclaimedDistributions = pending.filter(d => d.paymentStatus === 'pending');
      const totalUnclaimed = unclaimedDistributions.reduce((sum, d) => sum + (d.revenueShare || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          totalUnclaimed,
          distributions: unclaimedDistributions,
          count: unclaimedDistributions.length,
        },
      });
    } catch (dbError: any) {
      // Table doesn't exist yet - return empty data
      console.log('⚠️  revenue_distributions table not found, returning empty data');
      return res.status(200).json({
        success: true,
        data: {
          totalUnclaimed: 0,
          distributions: [],
          count: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Error getting unclaimed earnings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unclaimed earnings',
    });
  }
}

/**
 * Get grove harvest history
 */
async function handleGetGroveHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const groveId = req.url?.split('/groves/')[1]?.split('/history')[0];
    
    if (!groveId) {
      return res.status(400).json({
        success: false,
        error: 'Missing grove ID',
      });
    }

    console.log('📊 Getting harvest history for grove:', groveId);

    // Get grove info
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, parseInt(groveId)),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Get harvest records
    const harvests = await db.query.harvestRecords.findMany({
      where: eq(harvestRecords.groveId, parseInt(groveId)),
      orderBy: [desc(harvestRecords.harvestDate)],
    });

    return res.status(200).json({
      success: true,
      grove: {
        id: grove.id,
        name: grove.groveName,
        location: grove.location,
      },
      data: {
        harvests: harvests.map(h => ({
          id: h.id,
          harvestDate: h.harvestDate,
          yieldKg: h.yieldKg,
          qualityGrade: h.qualityGrade,
          salePricePerKg: h.salePricePerKg,
          totalRevenue: h.totalRevenue,
          farmerShare: h.farmerShare,
          investorShare: h.investorShare,
          revenueDistributed: h.revenueDistributed,
          transactionHash: h.transactionHash,
        })),
        stats: {
          totalHarvests: harvests.length,
          totalYield: harvests.reduce((sum, h) => sum + (h.yieldKg || 0), 0),
          totalRevenue: harvests.reduce((sum, h) => sum + (h.totalRevenue || 0), 0),
          averageYield: harvests.length > 0 ? harvests.reduce((sum, h) => sum + (h.yieldKg || 0), 0) / harvests.length : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting grove history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get grove history',
    });
  }
}

/**
 * Get grove funding history
 */
async function handleGetGroveFundingHistory(req: VercelRequest, res: VercelResponse) {
  try {
    const groveId = req.url?.split('/grove/')[1]?.split('/history')[0];
    
    if (!groveId) {
      return res.status(400).json({
        success: false,
        error: 'Missing grove ID',
      });
    }

    console.log('📊 Getting funding history for grove:', groveId);

    // Get grove info
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, parseInt(groveId)),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Get funding requests (if fundingRequests table exists)
    // For now, return empty array
    return res.status(200).json({
      success: true,
      grove: {
        id: grove.id,
        name: grove.groveName,
        location: grove.location,
      },
      data: {
        requests: [],
      },
    });
  } catch (error: any) {
    console.error('Error getting funding history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get funding history',
    });
  }
}

export default handleMantleAPI;


/**
 * Preview revenue distribution for a harvest
 */
async function handlePreviewDistribution(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const harvestId = parseInt(url.split('/').pop() || '0');

    if (!harvestId) {
      return res.status(400).json({
        success: false,
        error: 'Harvest ID is required',
      });
    }

    // Get harvest record
    const harvest = await db.query.harvestRecords.findFirst({
      where: eq(harvestRecords.id, harvestId),
    });

    if (!harvest) {
      return res.status(404).json({
        success: false,
        error: 'Harvest not found',
      });
    }

    // Get grove info
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, harvest.groveId),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    // Get actual investor count from database
    let investorCount = 0;
    
    if (grove.tokenAddress) {
      try {
        console.log('📊 Fetching token holders for grove:', grove.groveName);
        
        // Get potential holders from database
        const { createClient } = await import('@libsql/client');
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL || 'file:local.db',
          authToken: process.env.TURSO_AUTH_TOKEN
        });

        const potentialHolders = new Set<string>();
        
        // Strategy 1: Get from token_holdings table
        try {
          const holdingsResult = await client.execute({
            sql: `SELECT DISTINCT investor_address FROM token_holdings WHERE grove_id = ?`,
            args: [grove.id]
          });
          
          for (const row of holdingsResult.rows) {
            if (row.investor_address) {
              potentialHolders.add((row.investor_address as string).toLowerCase());
            }
          }
        } catch (error) {
          console.log('⚠️  token_holdings table query failed');
        }

        // Strategy 2: Get from marketplace
        try {
          const listingsResult = await client.execute({
            sql: `SELECT DISTINCT seller_address FROM marketplace_listings WHERE grove_id = ?`,
            args: [grove.id]
          });
          
          for (const row of listingsResult.rows) {
            if (row.seller_address) {
              potentialHolders.add((row.seller_address as string).toLowerCase());
            }
          }
        } catch (error) {
          console.log('⚠️  marketplace_listings query failed');
        }

        console.log(`📊 Found ${potentialHolders.size} potential holders from database`);

        // Check blockchain balances
        if (potentialHolders.size > 0) {
          const { MantleContractService } = await import('../lib/api/mantle-contract-service.js');
          const { GROVE_TOKEN_ABI } = await import('../lib/api/contract-abis.js');
          
          const contractService = new MantleContractService(
            process.env.MANTLE_NETWORK === 'mantleSepolia' ? 'mantleSepolia' : 'localhost'
          );
          
          const tokenContract = contractService.getContractByAddress(
            grove.tokenAddress,
            GROVE_TOKEN_ABI
          );

          for (const holder of potentialHolders) {
            try {
              const balance: bigint = await tokenContract.balanceOf(holder);
              if (balance > 0n) {
                investorCount++;
              }
            } catch (error) {
              console.error(`Error checking balance for ${holder}`);
            }
          }
        }
        
        console.log('📊 Found', investorCount, 'investors with non-zero balance');
        
      } catch (error: any) {
        console.error('Error fetching token holders:', error.message);
        // Continue with investorCount = 0 if query fails
      }
    }

    return res.status(200).json({
      success: true,
      preview: {
        harvestId: harvest.id,
        groveName: grove.groveName,
        totalRevenue: harvest.totalRevenue || 0,
        farmerShare: harvest.farmerShare || 0,
        investorPool: harvest.investorShare || 0,
        investorCount: investorCount,
        alreadyDistributed: harvest.revenueDistributed || false,
      },
    });
  } catch (error: any) {
    console.error('Error previewing distribution:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview distribution',
    });
  }
}

/**
 * Confirm and execute revenue distribution
 */
async function handleConfirmDistribution(req: VercelRequest, res: VercelResponse) {
  try {
    const { harvestId } = req.body;

    if (!harvestId) {
      return res.status(400).json({
        success: false,
        error: 'Harvest ID is required',
      });
    }

    console.log('📊 Starting revenue distribution for harvest:', harvestId);

    // Get harvest record from database
    const harvest = await db.query.harvestRecords.findFirst({
      where: eq(harvestRecords.id, harvestId),
    });

    if (!harvest) {
      return res.status(404).json({
        success: false,
        error: 'Harvest not found',
      });
    }

    if (harvest.revenueDistributed) {
      return res.status(400).json({
        success: false,
        error: 'Revenue has already been distributed for this harvest',
      });
    }

    // Additional check: See if distribution records already exist
    const existingDistributions = await db.query.revenueDistributions.findMany({
      where: eq(revenueDistributions.harvestId, harvestId),
    });

    if (existingDistributions.length > 0) {
      console.log('⚠️  Distribution records already exist for this harvest');
      return res.status(400).json({
        success: false,
        error: 'Distribution records already exist for this harvest',
      });
    }

    // Get grove info from database
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, harvest.groveId),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    console.log('📊 Grove:', grove.groveName, 'Token:', grove.tokenAddress);

    // Check if grove is tokenized
    if (!grove.tokenAddress) {
      // Grove not tokenized - farmer gets 100%
      console.log('📊 Grove not tokenized, farmer gets 100%');
      
      await db.update(harvestRecords)
        .set({ 
          revenueDistributed: true,
          farmerShare: harvest.totalRevenue,
          investorShare: 0,
          transactionHash: 'NOT_TOKENIZED',
        })
        .where(eq(harvestRecords.id, harvestId));

      return res.status(200).json({
        success: true,
        message: 'Revenue recorded - Grove not tokenized, farmer receives 100%',
        distribution: {
          farmerShare: harvest.totalRevenue,
          investorShare: 0,
          tokensSold: 0,
          totalTokens: 0,
        },
      });
    }

    // Grove is tokenized - check how many tokens are sold
    console.log('📊 Grove is tokenized, checking token sales...');
    
    // Query blockchain to get token balances
    const { MantleContractService } = await import('../lib/api/mantle-contract-service.js');
    const { GROVE_TOKEN_ABI, ISSUER_ABI } = await import('../lib/api/contract-abis.js');
    
    const contractService = new MantleContractService(
      process.env.MANTLE_NETWORK === 'mantleSepolia' ? 'mantleSepolia' : 'localhost'
    );
    
    const tokenContract = contractService.getContractByAddress(
      grove.tokenAddress,
      GROVE_TOKEN_ABI
    );
    
    // Get total supply and issuer balance
    const totalTokens: bigint = await tokenContract.totalSupply();
    const issuerAddress = process.env.MANTLE_ISSUER_ADDRESS;
    const tokensHeldByIssuer: bigint = await tokenContract.balanceOf(issuerAddress);
    const tokensSold: bigint = totalTokens - tokensHeldByIssuer;
    
    console.log('📊 Token analysis:', {
      totalTokens: totalTokens.toString(),
      tokensHeldByIssuer: tokensHeldByIssuer.toString(),
      tokensSold: tokensSold.toString(),
    });

    // Calculate distribution based on token ownership
    let farmerShare: number;
    let investorShare: number;

    if (tokensSold === 0n) {
      // No tokens sold - farmer gets 100%
      console.log('📊 No tokens sold, farmer gets 100%');
      farmerShare = harvest.totalRevenue || 0;
      investorShare = 0;
    } else {
      // Tokens sold - calculate proportional split
      // Revenue split: 30% farmer, 70% investors (proportional to tokens sold)
      const totalRevenue = harvest.totalRevenue || 0;
      const soldPercentage = Number(tokensSold) / Number(totalTokens);
      
      // Investor pool = (tokens sold / total tokens) * total revenue
      const investorRevenuePool = Math.floor(totalRevenue * soldPercentage);
      
      // From investor pool: 70% to investors, 30% to farmer
      investorShare = Math.floor(investorRevenuePool * 0.7);
      const farmerShareFromInvestorPool = Math.floor(investorRevenuePool * 0.3);
      
      // Unsold portion goes 100% to farmer
      const unsoldRevenue = totalRevenue - investorRevenuePool;
      
      farmerShare = farmerShareFromInvestorPool + unsoldRevenue;
      
      console.log('📊 Distribution calculation:', {
        soldPercentage: (soldPercentage * 100).toFixed(2) + '%',
        investorRevenuePool,
        investorShare: investorShare + ' (70% of investor pool)',
        farmerShareFromInvestorPool: farmerShareFromInvestorPool + ' (30% of investor pool)',
        unsoldRevenue: unsoldRevenue + ' (100% of unsold portion)',
        totalFarmerShare: farmerShare,
      });
    }

    // Update database with calculated shares
    await db.update(harvestRecords)
      .set({ 
        revenueDistributed: true,
        farmerShare: farmerShare,
        investorShare: investorShare,
        transactionHash: '0x' + Date.now().toString(16), // TODO: Actual blockchain tx
      })
      .where(eq(harvestRecords.id, harvestId));

    // Create individual revenue distribution records for each token holder
    if (investorShare > 0 && tokensSold > 0n) {
      console.log('📊 Creating individual distribution records for token holders...');
      
      // Get token holders from database
      const { createClient } = await import('@libsql/client');
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL || 'file:local.db',
        authToken: process.env.TURSO_AUTH_TOKEN
      });

      const potentialHolders = new Set<string>();
      
      // Strategy 1: Get from token_holdings table (most reliable)
      try {
        const holdingsResult = await client.execute({
          sql: `SELECT DISTINCT investor_address FROM token_holdings WHERE grove_id = ?`,
          args: [grove.id]
        });
        
        for (const row of holdingsResult.rows) {
          if (row.investor_address) {
            potentialHolders.add((row.investor_address as string).toLowerCase());
          }
        }
        console.log(`📊 Found ${holdingsResult.rows.length} investors from token_holdings table`);
      } catch (error: any) {
        console.log('⚠️  token_holdings table not found or empty:', error.message);
      }

      // Strategy 2: Get from marketplace listings (sellers must have held tokens)
      try {
        const listingsResult = await client.execute({
          sql: `SELECT DISTINCT seller_address FROM marketplace_listings WHERE grove_id = ?`,
          args: [grove.id]
        });
        
        for (const row of listingsResult.rows) {
          if (row.seller_address) {
            potentialHolders.add((row.seller_address as string).toLowerCase());
          }
        }
        console.log(`📊 Found ${listingsResult.rows.length} sellers from marketplace`);
      } catch (error) {
        console.log('⚠️  No marketplace listings found');
      }

      // Strategy 3: Get buyers from completed trades
      try {
        const tradesResult = await client.execute({
          sql: `SELECT DISTINCT buyer_address FROM marketplace_listings WHERE grove_id = ? AND status = 'sold' AND buyer_address IS NOT NULL`,
          args: [grove.id]
        });
        
        for (const row of tradesResult.rows) {
          if (row.buyer_address) {
            potentialHolders.add((row.buyer_address as string).toLowerCase());
          }
        }
        console.log(`📊 Found ${tradesResult.rows.length} buyers from trades`);
      } catch (error) {
        console.log('⚠️  No completed trades found');
      }

      console.log(`📊 Total potential holders to check: ${potentialHolders.size}`);

      // Check actual balances and create distribution records
      const distributions = [];
      let totalDistributed = 0;
      
      for (const holderAddress of potentialHolders) {
        try {
          const balance: bigint = await tokenContract.balanceOf(holderAddress);
          
          if (balance > 0n) {
            // Calculate this holder's share proportionally
            const holderPercentage = Number(balance) / Number(tokensSold);
            const holderShare = Math.floor(investorShare * holderPercentage);
            
            if (holderShare > 0) {
              distributions.push({
                harvestId: harvestId,
                holderAddress: holderAddress,
                tokenAmount: Number(balance),
                revenueShare: holderShare,
                distributionDate: Date.now(),
                transactionHash: null,
                payment_status: 'pending',
                transaction_id: null,
                paid_at: null,
              });
              
              totalDistributed += holderShare;
              console.log(`📊 ${holderAddress}: ${balance.toString()} tokens (${(holderPercentage * 100).toFixed(2)}%) = $${holderShare.toFixed(2)}`);
            }
          }
        } catch (error: any) {
          console.error(`⚠️  Error checking balance for ${holderAddress}:`, error.message);
        }
      }

      // Insert distribution records
      if (distributions.length > 0) {
        try {
          await db.insert(revenueDistributions).values(distributions);
          console.log(`✅ Created ${distributions.length} distribution records totaling $${totalDistributed.toFixed(2)}`);
        } catch (error: any) {
          console.error('❌ Error creating distribution records:', error);
          // Continue even if this fails - the harvest record is already updated
        }
      } else {
        console.log('⚠️  No active token holders found for distribution');
        console.log('💡 Tokens may have been purchased but holders not tracked in database');
        console.log('💡 Run: node scripts/create-token-holdings-table.cjs to create tracking table');
      }
    }

    console.log('✅ Revenue distribution calculated and recorded for harvest:', harvestId);
    console.log('📝 Note: Farmer can claim via /api/farmer/withdraw, investors via /api/investor/claim');

    return res.status(200).json({
      success: true,
      message: 'Revenue distribution completed successfully',
      distribution: {
        farmerShare: farmerShare,
        investorShare: investorShare,
        tokensSold: tokensSold.toString(),
        totalTokens: totalTokens.toString(),
        soldPercentage: tokensSold === 0n ? 0 : (Number(tokensSold) / Number(totalTokens) * 100).toFixed(2),
        note: 'Funds available for claiming. Farmer: /api/farmer/withdraw, Investors: /api/investor/claim',
      },
      transactionHash: '0x' + Date.now().toString(16),
    });
  } catch (error: any) {
    console.error('Error confirming distribution:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm distribution',
    });
  }
}


/**
 * Get farmer transactions (stub for now)
 */
async function handleGetFarmerTransactions(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const farmerAddress = url.split('/').pop();

    console.log('📊 Getting transactions for farmer:', farmerAddress);

    // Get withdrawals from database to show as transactions
    const withdrawals = await db
      .select()
      .from(farmerWithdrawals)
      .where(eq(farmerWithdrawals.farmerAddress, farmerAddress as string))
      .orderBy(desc(farmerWithdrawals.createdAt));

    // Convert withdrawals to transaction format
    const transactions = withdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount, // Negative because it's money going out
      status: w.status,
      date: w.createdAt,
      description: `Withdrawal from grove`,
      transactionHash: w.transactionHash,
      groveId: w.groveId
    }));

    console.log(`📊 Found ${transactions.length} transactions (withdrawals)`);

    return res.status(200).json({
      success: true,
      transactions: transactions,
    });
  } catch (error: any) {
    console.error('Error getting farmer transactions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transactions',
      transactions: [] // Return empty array on error
    });
  }
}


/**
 * Get token holders for a grove
 */
async function handleGetTokenHolders(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const params = new URLSearchParams(url.split('?')[1]);
    const groveId = params.get('groveId');

    if (!groveId) {
      return res.status(400).json({
        success: false,
        error: 'Grove ID is required',
      });
    }

    console.log('📊 Getting token holders for grove:', groveId);

    // Get grove from database
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, parseInt(groveId)),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    if (!grove.tokenAddress) {
      // Grove not tokenized - no token holders
      return res.status(200).json({
        success: true,
        holders: [],
        totalSupply: '0',
        investorCount: 0,
        message: 'Grove not tokenized',
      });
    }

    // Query blockchain for token holders via Transfer events
    const { MantleContractService } = await import('../lib/api/mantle-contract-service.js');
    const { GROVE_TOKEN_ABI } = await import('../lib/api/contract-abis.js');
    
    const contractService = new MantleContractService(
      process.env.MANTLE_NETWORK === 'mantleSepolia' ? 'mantleSepolia' : 'localhost'
    );
    
    const tokenContract = contractService.getContractByAddress(
      grove.tokenAddress,
      GROVE_TOKEN_ABI
    );

    // Get total supply
    const totalSupply: bigint = await tokenContract.totalSupply();
    
    // Get Transfer events to find all unique token holders
    const filter = tokenContract.filters.Transfer();
    const events = await tokenContract.queryFilter(filter);
    
    const holders = [];
    const holderBalances = new Map<string, bigint>();
    const issuerAddress = process.env.MANTLE_ISSUER_ADDRESS?.toLowerCase();
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    
    // Collect all addresses that received tokens
    const uniqueAddresses = new Set<string>();
    for (const event of events) {
      // Type guard: only EventLog has args property
      if ('args' in event) {
        const to = event.args?.to?.toLowerCase();
        if (to && to !== zeroAddress) {
          uniqueAddresses.add(to);
        }
      }
    }
    
    // Check current balance for each address
    for (const address of uniqueAddresses) {
      const balance: bigint = await tokenContract.balanceOf(address);
      if (balance > 0n) {
        holderBalances.set(address, balance);
        holders.push({
          address: address,
          balance: balance.toString(),
          percentage: (Number(balance) / Number(totalSupply) * 100).toFixed(2),
          isIssuer: address === issuerAddress,
          isFarmer: address === grove.farmerAddress.toLowerCase(),
        });
      }
    }
    
    // Count investors (exclude issuer)
    const investorCount = holders.filter(h => !h.isIssuer).length;

    console.log('📊 Found', holders.length, 'total holders,', investorCount, 'investors');

    return res.status(200).json({
      success: true,
      holders: holders,
      totalSupply: totalSupply.toString(),
      tokenAddress: grove.tokenAddress,
      investorCount: investorCount,
      totalHolders: holders.length,
    });
  } catch (error: any) {
    console.error('Error getting token holders:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get token holders',
    });
  }
}


/**
 * Get farmer's funding requests
 */
async function handleGetFundingRequests(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const farmerAddress = url.split('/api/funding/requests/')[1]?.split('?')[0];

    if (!farmerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Farmer address is required',
      });
    }

    console.log('📊 Getting funding requests for farmer:', farmerAddress);

    // For now, return empty array (MVP - no funding requests yet)
    // TODO: Implement database table and queries for funding requests
    return res.status(200).json({
      success: true,
      requests: [],
      message: 'Funding requests feature coming soon',
    });
  } catch (error: any) {
    console.error('Error getting funding requests:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get funding requests',
    });
  }
}

/**
 * Get funding pool for a grove
 */
async function handleGetFundingPool(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const groveId = url.split('/api/funding/pool/')[1]?.split('?')[0];

    if (!groveId) {
      return res.status(400).json({
        success: false,
        error: 'Grove ID is required',
      });
    }

    console.log('📊 Getting funding pool for grove:', groveId);

    // For now, return empty funding pool (MVP)
    // TODO: Implement funding pool tracking based on token sales
    return res.status(200).json({
      success: true,
      funds: {
        totalInvestment: 0,
        platformFeesCollected: 0,
        upfront: {
          allocated: 0,
          disbursed: 0,
          available: 0,
        },
        maintenance: {
          allocated: 0,
          disbursed: 0,
          available: 0,
        },
        harvest: {
          allocated: 0,
          disbursed: 0,
          available: 0,
        },
      },
      message: 'Funding pool feature coming soon',
    });
  } catch (error: any) {
    console.error('Error getting funding pool:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get funding pool',
    });
  }
}

/**
 * Create new funding request
 */
async function handleCreateFundingRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const { groveId, farmerAddress, milestoneType, amount, purpose } = req.body;

    if (!groveId || !farmerAddress || !milestoneType || !amount || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    console.log('📊 Creating funding request:', { groveId, farmerAddress, milestoneType, amount });

    // For now, return success but don't actually create (MVP)
    // TODO: Implement database table and creation logic
    return res.status(200).json({
      success: true,
      request: {
        id: Date.now(),
        groveId,
        farmerAddress,
        milestoneType,
        amountRequested: amount,
        purpose,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      message: 'Funding request created (MVP - not persisted yet)',
    });
  } catch (error: any) {
    console.error('Error creating funding request:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create funding request',
    });
  }
}

/**
 * Get funding request details
 */
async function handleGetFundingRequestDetails(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '';
    const requestId = url.split('/api/funding/request/')[1]?.split('?')[0];

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required',
      });
    }

    console.log('📊 Getting funding request details:', requestId);

    // For now, return not found (MVP)
    // TODO: Implement database query
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'Funding requests feature coming soon',
    });
  } catch (error: any) {
    console.error('Error getting funding request details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get funding request details',
    });
  }
}

/**
 * Get available groves for investment
 */
async function handleGetAvailableGroves(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('📊 Getting available groves for investment');

    // Query tokenized groves from database
    const tokenizedGroves = await db.query.coffeeGroves.findMany({
      where: eq(coffeeGroves.isTokenized, true),
      orderBy: (groves, { desc }) => [desc(groves.tokenizedAt)],
    });

    console.log(`📊 Found ${tokenizedGroves.length} tokenized groves`);

    // Transform groves to match frontend expected format
    const groves = tokenizedGroves
      .filter(grove => grove.tokenAddress) // Only include groves with token addresses
      .map(grove => {
        const totalYield = (grove.treeCount || 0) * (grove.expectedYieldPerTree || 0);
        const totalTokens = grove.totalTokensIssued || 0;
        const tokensSold = grove.tokensSold || 0;
        const tokensAvailable = totalTokens - tokensSold;
        
        // Calculate price per token (example: $10 per token)
        const pricePerToken = 10.00;
        
        // Calculate projected annual return (example: 8-12% based on health score)
        const healthScore = grove.currentHealthScore || 70;
        const projectedAnnualReturn = Math.min(12, Math.max(8, 8 + (healthScore - 70) / 10));

        return {
          id: grove.id,
          groveName: grove.groveName,
          location: grove.location,
          latitude: grove.coordinatesLat,
          longitude: grove.coordinatesLng,
          treeCount: grove.treeCount,
          coffeeVariety: grove.coffeeVariety,
          expectedYieldPerTree: grove.expectedYieldPerTree || 0,
          totalYield: totalYield,
          healthScore: grove.currentHealthScore || 0,
          verificationStatus: grove.verificationStatus || 'pending',
          tokenAddress: grove.tokenAddress,
          tokenSymbol: grove.tokenSymbol,
          totalTokens: totalTokens,
          tokensSold: tokensSold,
          tokensAvailable: tokensAvailable,
          pricePerToken: pricePerToken,
          projectedAnnualReturn: projectedAnnualReturn.toFixed(1),
          farmerAddress: grove.farmerAddress,
          createdAt: grove.createdAt,
          tokenizedAt: grove.tokenizedAt,
        };
      });

    return res.status(200).json({
      success: true,
      groves: groves,
      count: groves.length,
    });
  } catch (error: any) {
    console.error('Error getting available groves:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available groves',
      groves: [],
    });
  }
}

/**
 * Get investor portfolio
 */
async function handleGetInvestorPortfolio(req: VercelRequest, res: VercelResponse) {
  try {
    const investorAddress = req.query.investorAddress as string;

    if (!investorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Investor address is required',
      });
    }

    console.log('📊 Getting portfolio for investor:', investorAddress);

    // Get all tokenized groves
    const tokenizedGroves = await db.query.coffeeGroves.findMany({
      where: eq(coffeeGroves.isTokenized, true),
    });

    console.log(`📊 Checking ${tokenizedGroves.length} tokenized groves for holdings`);

    // Query blockchain for investor's token balances
    const { MantleContractService } = await import('../lib/api/mantle-contract-service.js');
    const { GROVE_TOKEN_ABI } = await import('../lib/api/contract-abis.js');
    
    const contractService = new MantleContractService(
      process.env.MANTLE_NETWORK === 'mantleSepolia' ? 'mantleSepolia' : 'localhost'
    );

    const holdings = [];
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    // Get active marketplace listings for this investor to subtract from available balance
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    const listingsResult = await client.execute({
      sql: `SELECT grove_id, SUM(token_amount) as listed_amount 
            FROM marketplace_listings 
            WHERE seller_address = ? AND status = 'active' AND expires_at > ?
            GROUP BY grove_id`,
      args: [investorAddress, Date.now()]
    });

    const listedTokensByGrove = new Map();
    for (const row of listingsResult.rows) {
      listedTokensByGrove.set(Number(row.grove_id), Number(row.listed_amount));
    }

    for (const grove of tokenizedGroves) {
      if (!grove.tokenAddress) continue;

      try {
        const tokenContract = contractService.getContractByAddress(
          grove.tokenAddress,
          GROVE_TOKEN_ABI
        );

        // Get investor's balance
        const balance: bigint = await tokenContract.balanceOf(investorAddress);
        
        if (balance > 0n) {
          const totalBalanceNumber = Number(balance);
          const listedAmount = listedTokensByGrove.get(grove.id) || 0;
          const availableBalance = totalBalanceNumber - listedAmount;
          
          // Only show holding if there are available (non-listed) tokens
          if (availableBalance > 0) {
            const pricePerToken = 10.00; // Same as in available groves
            const investmentValue = availableBalance * pricePerToken;
            
            // Calculate earnings from revenue distributions (if table exists)
            let earnings = 0;
            try {
              const distributions = await db.select()
                .from(revenueDistributions)
                .where(eq(revenueDistributions.holderAddress, investorAddress.toLowerCase()));
              
              earnings = distributions
                .filter(d => d.paymentStatus === 'completed')
                .reduce((sum, d) => sum + (d.revenueShare || 0), 0);
            } catch (dbError: any) {
              // Table doesn't exist yet - no earnings
              console.log('⚠️  revenue_distributions table not found, earnings = 0');
            }

            const totalValue = investmentValue + earnings;

            holdings.push({
              groveId: grove.id,
              groveName: grove.groveName,
              location: grove.location,
              tokenAddress: grove.tokenAddress,
              tokenSymbol: grove.tokenSymbol,
              tokenBalance: availableBalance,
              totalBalance: totalBalanceNumber,
              listedAmount: listedAmount,
              investmentValue: investmentValue,
              currentValue: totalValue,
              earnings: earnings,
              healthScore: grove.currentHealthScore || 0,
              coffeeVariety: grove.coffeeVariety,
            });

            totalInvestment += investmentValue;
            totalCurrentValue += totalValue;
          }
        }
      } catch (error: any) {
        console.error(`Error checking balance for grove ${grove.groveName}:`, error.message);
        // Continue checking other groves
      }
    }

    const totalEarnings = totalCurrentValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 
      ? ((totalEarnings / totalInvestment) * 100).toFixed(2)
      : '0.00';

    console.log(`📊 Found ${holdings.length} holdings for investor`);

    return res.status(200).json({
      success: true,
      portfolio: {
        investorAddress: investorAddress,
        holdings: holdings,
        summary: {
          totalInvestment: totalInvestment,
          totalCurrentValue: totalCurrentValue,
          totalEarnings: totalEarnings,
          returnPercentage: returnPercentage,
          numberOfGroves: holdings.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting investor portfolio:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get investor portfolio',
      portfolio: {
        holdings: [],
        summary: {
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalEarnings: 0,
          returnPercentage: '0.00',
          numberOfGroves: 0,
        },
      },
    });
  }
}

/**
 * Purchase grove tokens
 */
async function handlePurchaseTokens(req: VercelRequest, res: VercelResponse) {
  try {
    const { groveId, tokenAmount, investorAddress, termsAccepted, termsVersion, transactionHash } = req.body;

    if (!groveId || !tokenAmount || !investorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groveId, tokenAmount, investorAddress',
      });
    }

    console.log(' Recording token purchase:', { groveId, tokenAmount, investorAddress, transactionHash });

    // Get grove from database
    const grove = await db.query.coffeeGroves.findFirst({
      where: eq(coffeeGroves.id, parseInt(groveId)),
    });

    if (!grove) {
      return res.status(404).json({
        success: false,
        error: 'Grove not found',
      });
    }

    if (!grove.isTokenized || !grove.tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Grove is not tokenized',
      });
    }

    // Check if enough tokens are available
    const totalTokens = grove.totalTokensIssued || 0;
    const tokensSold = grove.tokensSold || 0;
    const tokensAvailable = totalTokens - tokensSold;

    if (tokenAmount > tokensAvailable) {
      return res.status(400).json({
        success: false,
        error: `Insufficient tokens available. Available: ${tokensAvailable}, Requested: ${tokenAmount}`,
      });
    }

    // Calculate purchase price
    const pricePerToken = 10.00;
    const totalPrice = tokenAmount * pricePerToken;

    console.log(' Purchase details:', {
      tokenAmount,
      pricePerToken,
      totalPrice,
      tokensAvailable,
      transactionHash,
    });

    try {
      // Use provided transaction hash or generate mock one
      const txHash = transactionHash || ('0x' + Date.now().toString(16) + Math.random().toString(16).substr(2, 40));
      
      if (transactionHash) {
        console.log(' Recording blockchain purchase:', txHash);
      } else {
        console.log(' Mock purchase (no blockchain):', txHash);
      }
      
      // Update database: increment tokensSold
      await db.update(coffeeGroves)
        .set({
          tokensSold: tokensSold + tokenAmount,
          updatedAt: Date.now(),
        })
        .where(eq(coffeeGroves.id, grove.id));

      console.log('✅ Database updated: tokensSold incremented');

      // Record token holding for distribution tracking
      try {
        const { createClient } = await import('@libsql/client');
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL || 'file:local.db',
          authToken: process.env.TURSO_AUTH_TOKEN
        });

        await client.execute({
          sql: `INSERT INTO token_holdings 
                (investor_address, grove_id, token_address, token_amount, purchase_price, transaction_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            investorAddress.toLowerCase(),
            grove.id,
            grove.tokenAddress,
            tokenAmount,
            totalPrice,
            txHash,
            Date.now(),
            Date.now()
          ]
        });

        console.log('✅ Token holding recorded for distribution tracking');
      } catch (holdingError: any) {
        console.error('⚠️  Failed to record token holding:', holdingError.message);
        // Continue even if this fails - the main purchase is recorded
      }

      // TODO: Record terms acceptance (requires investor_profiles table migration)
      // if (termsAccepted && termsVersion) {
      //   const existingProfile = await db.query.investorProfiles.findFirst({
      //     where: eq(investorProfiles.investorAddress, investorAddress),
      //   });
      //   if (existingProfile) {
      //     await db.update(investorProfiles)
      //       .set({ termsAcceptedAt: Date.now(), termsVersion, updatedAt: Date.now() })
      //       .where(eq(investorProfiles.investorAddress, investorAddress));
      //   } else {
      //     await db.insert(investorProfiles).values({
      //       investorAddress, termsAcceptedAt: Date.now(), termsVersion,
      //       createdAt: Date.now(), updatedAt: Date.now(),
      //     });
      //   }
      // }

      const explorerUrl = `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;

      return res.status(200).json({
        success: true,
        message: 'Tokens purchased successfully',
        data: {
          holdingId: `${grove.id}-${investorAddress}`,
          groveId: grove.id,
          groveName: grove.groveName,
          tokenAmount: tokenAmount,
          totalPrice: totalPrice,
          pricePerToken: pricePerToken,
          investorAddress: investorAddress,
          transactionHash: txHash,
          blockExplorerUrl: explorerUrl,
        },
        transactionHash: txHash,
      });
    } catch (blockchainError: any) {
      console.error('❌ Database update failed:', blockchainError);
      
      return res.status(500).json({
        success: false,
        error: `Database update failed: ${blockchainError.message}`,
      });
    }
  } catch (error: any) {
    console.error('Error processing token purchase:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process token purchase',
    });
  }
}
