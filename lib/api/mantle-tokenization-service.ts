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

      // Calculate total supply
      const totalSupply = params.numberOfTrees * params.tokensPerTree;

      // Call contract to tokenize grove
      const receipt = await this.mantleService.executeContract(
        'ISSUER',
        ISSUER_ABI,
        'tokenizeGrove',
        params.groveName,
        params.location,
        params.numberOfTrees,
        params.tokensPerTree
      );

      // Parse event to get grove ID and token address
      const issuerContract = this.mantleService.getContract('ISSUER', ISSUER_ABI);
      const groveTokenizedEvent = receipt.logs
        .map((log: any) => {
          try {
            return issuerContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'GroveTokenized');

      if (!groveTokenizedEvent) {
        throw new Error('GroveTokenized event not found in transaction receipt');
      }

      const groveId = Number(groveTokenizedEvent.args.groveId);
      const tokenAddress = groveTokenizedEvent.args.tokenAddress;

      console.log(`✅ Grove tokenized! ID: ${groveId}, Token: ${tokenAddress}`);

      // Update database
      await db.insert(coffeeGroves).values({
        groveName: params.groveName,
        location: params.location,
        numberOfTrees: params.numberOfTrees,
        tokensPerTree: params.tokensPerTree,
        totalSupply,
        farmerAddress: params.farmerAddress,
        tokenAddress,
        groveId,
        status: 'active',
        createdAt: Date.now(),
      });

      return {
        success: true,
        groveId,
        tokenAddress,
        totalSupply: totalSupply.toString(),
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
  async getGroveInfo(groveId: number) {
    try {
      const groveInfo = await this.mantleService.callContract(
        'ISSUER',
        ISSUER_ABI,
        'getGroveInfo',
        groveId
      );

      return {
        name: groveInfo[0],
        location: groveInfo[1],
        trees: Number(groveInfo[2]),
        tokenAddress: groveInfo[3],
        farmer: groveInfo[4],
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
