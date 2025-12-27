/**
 * Grove Tokenization Service for Mantle Network
 * Replaces Hedera-based tokenization with Mantle/EVM
 */

import { getMantleService } from './mantle-contract-service.js';
import { ISSUER_ABI, GROVE_TOKEN_ABI } from './contract-abis.js';
import { db } from '../../db/index.js';
import { coffeeGroves } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface TokenizeGroveParams {
  groveName: string;
  location: string;
  numberOfTrees: number;
  tokensPerTree: number;
  farmerAddress: string;
}

export interface TokenizationResult {
  success: boolean;
  groveId?: number;
  tokenAddress?: string;
  totalSupply?: string;
  transactionHash?: string;
  error?: string;
}

export class MantleTokenizationService {
  private mantleService = getMantleService();

  /**
   * Tokenize a coffee grove
   */
  async tokenizeGrove(params: TokenizeGroveParams): Promise<TokenizationResult> {
    try {
      console.log('🌳 Starting grove tokenization on Mantle...');
      console.log('Grove:', params.groveName);
      console.log('Trees:', params.numberOfTrees);
      console.log('Tokens per tree:', params.tokensPerTree);

      // Step 1: Check if grove is already registered on-chain
      console.log('📝 Checking if grove is registered on-chain...');
      let isRegistered = false;
      try {
        const groveInfo = await this.mantleService.callContract(
          'ISSUER',
          ISSUER_ABI,
          'getGroveInfo',
          params.groveName
        );
        // If farmer address is not zero, grove is registered
        isRegistered = groveInfo.farmer !== '0x0000000000000000000000000000000000000000';
        console.log('ℹ️ Grove registration status:', isRegistered ? 'Already registered' : 'Not registered');
      } catch (error: any) {
        console.log('ℹ️ Grove not found on-chain, will register');
      }

      // Step 2: Register grove on-chain if not already registered
      if (!isRegistered) {
        console.log('📝 Registering grove on-chain...');
        try {
          await this.mantleService.executeContract(
            'ISSUER',
            ISSUER_ABI,
            'registerCoffeeGrove',
            params.groveName,
            params.location,
            params.numberOfTrees,
            'Arabica', // Default variety
            100 // Default expected yield per tree
          );
          console.log('✅ Grove registered on-chain');
        } catch (error: any) {
          // Grove might already be registered, continue
          if (error.message?.includes('GroveAlreadyExists')) {
            console.log('ℹ️ Grove already registered on-chain, continuing...');
          } else {
            throw error;
          }
        }
      } else {
        console.log('✅ Grove already registered on-chain, skipping registration');
      }

      // Step 3: Tokenize the grove
      console.log('🪙 Tokenizing grove...');
      const receipt = await this.mantleService.executeContract(
        'ISSUER',
        ISSUER_ABI,
        'tokenizeCoffeeGrove',
        params.groveName,
        params.tokensPerTree
      );

      // Parse event to get token address
      const issuerContract = this.mantleService.getContract('ISSUER', ISSUER_ABI);
      const groveTokenizedEvent = receipt.logs
        .map((log: any) => {
          try {
            return issuerContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'CoffeeGroveTokenized');

      if (!groveTokenizedEvent) {
        throw new Error('CoffeeGroveTokenized event not found in transaction receipt');
      }

      const tokenAddress = groveTokenizedEvent.args.token; // Event uses 'token' not 'tokenAddress'
      const totalTokens = Number(groveTokenizedEvent.args.totalTokens);

      console.log(`✅ Grove tokenized! Token: ${tokenAddress}, Total: ${totalTokens}`);

      // Update database
      await db.update(coffeeGroves)
        .set({
          isTokenized: true,
          tokenAddress,
          totalTokensIssued: totalTokens,
          tokenizedAt: Date.now(),
        })
        .where(eq(coffeeGroves.groveName, params.groveName));

      return {
        success: true,
        tokenAddress,
        totalSupply: totalTokens.toString(),
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Tokenization failed:', error);
      return {
        success: false,
        error: error.message || 'Tokenization failed',
      };
    }
  }

  /**
   * Get grove token info
   */
  async getGroveTokenInfo(tokenAddress: string) {
    try {
      const tokenContract = this.mantleService.getContractByAddress(
        tokenAddress,
        GROVE_TOKEN_ABI
      );

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      };
    } catch (error: any) {
      console.error('❌ Failed to get token info:', error);
      throw error;
    }
  }

  /**
   * Get grove token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress: string) {
    return await this.mantleService.getTokenBalance(tokenAddress, userAddress);
  }

  /**
   * Transfer grove tokens
   */
  async transferTokens(tokenAddress: string, to: string, amount: string) {
    return await this.mantleService.transferTokens(tokenAddress, to, amount);
  }

  /**
   * Get grove info from contract
   */
  async getGroveInfo(groveName: string) {
    try {
      const groveInfo = await this.mantleService.callContract(
        'ISSUER',
        ISSUER_ABI,
        'getGroveInfo',
        groveName
      );

      return {
        name: groveInfo.groveName,
        location: groveInfo.location,
        trees: Number(groveInfo.treeCount),
        tokenAddress: groveInfo.tokenAddress,
        farmer: groveInfo.farmer,
        isTokenized: groveInfo.isTokenized,
      };
    } catch (error: any) {
      console.error('❌ Failed to get grove info:', error);
      throw error;
    }
  }

  /**
   * Get total grove count
   */
  async getGroveCount() {
    const count = await this.mantleService.callContract(
      'ISSUER',
      ISSUER_ABI,
      'getGroveCount'
    );
    return Number(count);
  }
}

// Create singleton instance
let tokenizationService: MantleTokenizationService | null = null;

export function getMantleTokenizationService() {
  if (!tokenizationService) {
    tokenizationService = new MantleTokenizationService();
  }
  return tokenizationService;
}

export default MantleTokenizationService;
