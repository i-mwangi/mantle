/**
 * Payment Service for Mantle Network
 * Handles USDC transfers and payments
 */

import { getMantleService } from './mantle-contract-service.js';
import { USDC_ABI } from './contract-abis.js';
import { ethers } from 'ethers';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  amount?: string;
  error?: string;
}

export class MantlePaymentService {
  private mantleService = getMantleService();

  /**
   * Send USDC payment
   */
  async sendUSDC(to: string, amount: string): Promise<PaymentResult> {
    try {
      console.log(`💸 Sending ${amount} USDC to ${to}...`);

      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await usdcContract.transfer(to, amountWei);
      console.log(`📤 Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Payment confirmed: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        amount,
      };
    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(address: string): Promise<string> {
    try {
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Approve USDC spending
   */
  async approveUSDC(spender: string, amount: string): Promise<PaymentResult> {
    try {
      console.log(`✅ Approving ${amount} USDC for ${spender}...`);

      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await usdcContract.approve(spender, amountWei);
      console.log(`📤 Approval sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Approval confirmed: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        amount,
      };
    } catch (error: any) {
      console.error('❌ Approval failed:', error);
      return {
        success: false,
        error: error.message || 'Approval failed',
      };
    }
  }

  /**
   * Check USDC allowance
   */
  async getUSDCAllowance(owner: string, spender: string): Promise<string> {
    try {
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const allowance = await usdcContract.allowance(owner, spender);
      const decimals = await usdcContract.decimals();
      return ethers.formatUnits(allowance, decimals);
    } catch (error: any) {
      console.error('❌ Failed to get allowance:', error);
      throw error;
    }
  }

  /**
   * Mint USDC (for testing only)
   */
  async mintUSDC(to: string, amount: string): Promise<PaymentResult> {
    try {
      console.log(`🪙 Minting ${amount} USDC to ${to}...`);

      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await usdcContract.mint(to, amountWei);
      console.log(`📤 Mint transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Mint confirmed: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        amount,
      };
    } catch (error: any) {
      console.error('❌ Mint failed:', error);
      return {
        success: false,
        error: error.message || 'Mint failed',
      };
    }
  }

  /**
   * Batch send USDC to multiple recipients
   */
  async batchSendUSDC(
    recipients: Array<{ address: string; amount: string }>
  ): Promise<PaymentResult[]> {
    const results: PaymentResult[] = [];

    for (const recipient of recipients) {
      const result = await this.sendUSDC(recipient.address, recipient.amount);
      results.push(result);
    }

    return results;
  }
}

// Create singleton instance
let paymentService: MantlePaymentService | null = null;

export function getMantlePaymentService() {
  if (!paymentService) {
    paymentService = new MantlePaymentService();
  }
  return paymentService;
}

export default MantlePaymentService;
