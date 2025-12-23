/**
 * Price Oracle Service for Mantle Network
 * Handles coffee price updates and queries
 */

import { getMantleService } from './mantle-contract-service.js';
import { PRICE_ORACLE_ABI } from './contract-abis.js';
import { ethers } from 'ethers';

export interface PriceUpdateResult {
  success: boolean;
  price?: string;
  transactionHash?: string;
  error?: string;
}

export class MantlePriceOracleService {
  private mantleService = getMantleService();

  /**
   * Update coffee price
   * @param priceInCents - Price in cents (e.g., 250 for $2.50)
   */
  async updatePrice(priceInCents: number): Promise<PriceUpdateResult> {
    try {
      console.log(`📊 Updating coffee price to ${priceInCents} cents...`);

      const receipt = await this.mantleService.executeContract(
        'PRICE_ORACLE',
        PRICE_ORACLE_ABI,
        'updatePrice',
        priceInCents
      );

      console.log(`✅ Price updated to ${priceInCents} cents`);

      return {
        success: true,
        price: (priceInCents / 100).toFixed(2),
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Price update failed:', error);
      return {
        success: false,
        error: error.message || 'Price update failed',
      };
    }
  }

  /**
   * Get current coffee price
   * @returns Price in cents
   */
  async getPrice(): Promise<number> {
    try {
      const price = await this.mantleService.callContract(
        'PRICE_ORACLE',
        PRICE_ORACLE_ABI,
        'getPrice'
      );
      return Number(price);
    } catch (error: any) {
      // Silently fail if oracle not initialized (expected during development)
      if (error.code === 'CALL_EXCEPTION' && error.reason === 'require(false)') {
        throw new Error('Price oracle not initialized');
      }
      console.error('❌ Failed to get price:', error);
      throw error;
    }
  }

  /**
   * Get price in dollars
   */
  async getPriceInDollars(): Promise<string> {
    const priceInCents = await this.getPrice();
    return (priceInCents / 100).toFixed(2);
  }

  /**
   * Get last update time
   */
  async getLastUpdateTime(): Promise<number> {
    try {
      const timestamp = await this.mantleService.callContract(
        'PRICE_ORACLE',
        PRICE_ORACLE_ABI,
        'getLastUpdateTime'
      );
      return Number(timestamp);
    } catch (error: any) {
      // Silently fail if oracle not initialized (expected during development)
      if (error.code === 'CALL_EXCEPTION' && error.reason === 'require(false)') {
        throw new Error('Price oracle not initialized');
      }
      console.error('❌ Failed to get last update time:', error);
      throw error;
    }
  }

  /**
   * Get price info (price + last update)
   */
  async getPriceInfo() {
    try {
      const [priceInCents, lastUpdate] = await Promise.all([
        this.getPrice(),
        this.getLastUpdateTime(),
      ]);

      return {
        priceInCents,
        priceInDollars: (priceInCents / 100).toFixed(2),
        lastUpdate,
        lastUpdateDate: new Date(lastUpdate * 1000).toISOString(),
      };
    } catch (error: any) {
      // Silently fail if oracle not initialized (expected during development)
      if (error.message === 'Price oracle not initialized') {
        throw error;
      }
      console.error('❌ Failed to get price info:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue for harvest
   * @param kilograms - Amount of coffee harvested in kg
   * @returns Revenue in USDC
   */
  async calculateRevenue(kilograms: number): Promise<string> {
    const priceInCents = await this.getPrice();
    const pricePerKg = priceInCents / 100;
    const revenue = kilograms * pricePerKg;
    return revenue.toFixed(2);
  }
}

// Create singleton instance
let priceOracleService: MantlePriceOracleService | null = null;

export function getMantlePriceOracleService() {
  if (!priceOracleService) {
    priceOracleService = new MantlePriceOracleService();
  }
  return priceOracleService;
}

export default MantlePriceOracleService;
