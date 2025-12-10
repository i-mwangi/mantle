/**
 * Lending Service for Mantle Network
 * Handles lending pool operations, deposits, withdrawals, loans
 */

import { getMantleService } from './mantle-contract-service.js';
import { LENDING_POOL_ABI, LP_TOKEN_ABI, USDC_ABI } from './contract-abis.js';
import { ethers } from 'ethers';
import { db } from '../../db/index.js';
import { providedLiquidity, withdrawnLiquidity, loans } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface DepositResult {
  success: boolean;
  amount?: string;
  lpTokensReceived?: string;
  transactionHash?: string;
  error?: string;
}

export interface WithdrawResult {
  success: boolean;
  amount?: string;
  lpTokensBurned?: string;
  transactionHash?: string;
  error?: string;
}

export interface BorrowResult {
  success: boolean;
  loanId?: number;
  borrowedAmount?: string;
  collateralAmount?: string;
  transactionHash?: string;
  error?: string;
}

export interface RepayResult {
  success: boolean;
  loanId?: number;
  repaidAmount?: string;
  transactionHash?: string;
  error?: string;
}

export class MantleLendingService {
  private mantleService = getMantleService();

  /**
   * Deposit USDC into lending pool
   */
  async deposit(userAddress: string, amount: string): Promise<DepositResult> {
    try {
      console.log(`💰 Depositing ${amount} USDC to lending pool...`);

      // First, approve USDC spending
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Approve USDC
      console.log('📝 Approving USDC...');
      const approveTx = await usdcContract.approve(lendingPoolAddress, amountWei);
      await approveTx.wait();
      console.log('✅ USDC approved');

      // Deposit
      const receipt = await this.mantleService.executeContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'deposit',
        amountWei
      );

      // Get LP token balance to see how many were received
      const lpTokenAddress = await this.mantleService.callContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'getLPToken'
      );

      const lpTokenContract = this.mantleService.getContractByAddress(
        lpTokenAddress,
        LP_TOKEN_ABI
      );
      const lpBalance = await lpTokenContract.balanceOf(userAddress);
      const lpDecimals = await lpTokenContract.decimals();
      const lpTokensReceived = ethers.formatUnits(lpBalance, lpDecimals);

      // Record in database
      await db.insert(providedLiquidity).values({
        investorAddress: userAddress,
        amount: parseFloat(amount),
        lpTokensReceived: parseFloat(lpTokensReceived),
        transactionHash: receipt.hash,
        timestamp: Date.now(),
      });

      console.log(`✅ Deposited ${amount} USDC, received ${lpTokensReceived} LP tokens`);

      return {
        success: true,
        amount,
        lpTokensReceived,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Deposit failed:', error);
      return {
        success: false,
        error: error.message || 'Deposit failed',
      };
    }
  }

  /**
   * Withdraw USDC from lending pool
   */
  async withdraw(userAddress: string, amount: string): Promise<WithdrawResult> {
    try {
      console.log(`💸 Withdrawing ${amount} USDC from lending pool...`);

      const decimals = 6; // USDC decimals
      const amountWei = ethers.parseUnits(amount, decimals);

      const receipt = await this.mantleService.executeContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'withdraw',
        amountWei
      );

      // Record in database
      await db.insert(withdrawnLiquidity).values({
        investorAddress: userAddress,
        amount: parseFloat(amount),
        transactionHash: receipt.hash,
        timestamp: Date.now(),
      });

      console.log(`✅ Withdrew ${amount} USDC`);

      return {
        success: true,
        amount,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Withdrawal failed:', error);
      return {
        success: false,
        error: error.message || 'Withdrawal failed',
      };
    }
  }

  /**
   * Borrow USDC using grove tokens as collateral
   */
  async borrow(
    borrowerAddress: string,
    collateralTokenAddress: string,
    collateralAmount: string,
    borrowAmount: string
  ): Promise<BorrowResult> {
    try {
      console.log(`🏦 Borrowing ${borrowAmount} USDC...`);
      console.log(`Collateral: ${collateralAmount} tokens at ${collateralTokenAddress}`);

      // Approve collateral token
      const collateralContract = this.mantleService.getContractByAddress(
        collateralTokenAddress,
        LP_TOKEN_ABI // Using LP_TOKEN_ABI as it's ERC20
      );

      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      const collateralDecimals = await collateralContract.decimals();
      const collateralWei = ethers.parseUnits(collateralAmount, collateralDecimals);

      console.log('📝 Approving collateral...');
      const approveTx = await collateralContract.approve(lendingPoolAddress, collateralWei);
      await approveTx.wait();
      console.log('✅ Collateral approved');

      // Borrow
      const borrowDecimals = 6; // USDC decimals
      const borrowWei = ethers.parseUnits(borrowAmount, borrowDecimals);

      const receipt = await this.mantleService.executeContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'borrow',
        collateralTokenAddress,
        collateralWei,
        borrowWei
      );

      // Parse event to get loan ID
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const borrowedEvent = receipt.logs
        .map((log: any) => {
          try {
            return lendingPoolContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'Borrowed');

      const loanId = borrowedEvent ? Number(borrowedEvent.args.loanId) : 0;

      // Record in database
      await db.insert(loans).values({
        borrowerAddress,
        collateralTokenAddress,
        collateralAmount: parseFloat(collateralAmount),
        borrowedAmount: parseFloat(borrowAmount),
        loanId,
        transactionHash: receipt.hash,
        status: 'active',
        timestamp: Date.now(),
      });

      console.log(`✅ Borrowed ${borrowAmount} USDC, loan ID: ${loanId}`);

      return {
        success: true,
        loanId,
        borrowedAmount: borrowAmount,
        collateralAmount,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Borrow failed:', error);
      return {
        success: false,
        error: error.message || 'Borrow failed',
      };
    }
  }

  /**
   * Repay loan
   */
  async repay(borrowerAddress: string, loanId: number, amount: string): Promise<RepayResult> {
    try {
      console.log(`💳 Repaying loan ${loanId} with ${amount} USDC...`);

      // Approve USDC
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      console.log('📝 Approving USDC...');
      const approveTx = await usdcContract.approve(lendingPoolAddress, amountWei);
      await approveTx.wait();
      console.log('✅ USDC approved');

      // Repay
      const receipt = await this.mantleService.executeContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'repay',
        loanId,
        amountWei
      );

      // Update database
      await db.update(loans)
        .set({
          isRepaid: true,
          isActive: false,
        })
        .where(eq(loans.id, loanId));

      console.log(`✅ Repaid ${amount} USDC for loan ${loanId}`);

      return {
        success: true,
        loanId,
        repaidAmount: amount,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Repayment failed:', error);
      return {
        success: false,
        error: error.message || 'Repayment failed',
      };
    }
  }

  /**
   * Get user's deposit balance
   */
  async getUserDeposit(userAddress: string): Promise<string> {
    try {
      const deposit = await this.mantleService.callContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'getUserDeposit',
        userAddress
      );
      return ethers.formatUnits(deposit, 6); // USDC decimals
    } catch (error: any) {
      console.error('❌ Failed to get user deposit:', error);
      throw error;
    }
  }

  /**
   * Get loan details
   */
  async getLoan(loanId: number) {
    try {
      const loan = await this.mantleService.callContract(
        'LENDING_POOL',
        LENDING_POOL_ABI,
        'getLoan',
        loanId
      );

      return {
        borrower: loan[0],
        collateralAmount: ethers.formatUnits(loan[1], 18),
        borrowedAmount: ethers.formatUnits(loan[2], 6),
        interestRate: Number(loan[3]),
        active: loan[4],
      };
    } catch (error: any) {
      console.error('❌ Failed to get loan:', error);
      throw error;
    }
  }

  /**
   * Get LP token address
   */
  async getLPTokenAddress(): Promise<string> {
    return await this.mantleService.callContract(
      'LENDING_POOL',
      LENDING_POOL_ABI,
      'getLPToken'
    );
  }

  /**
   * Get LP token balance
   */
  async getLPTokenBalance(userAddress: string): Promise<string> {
    const lpTokenAddress = await this.getLPTokenAddress();
    return await this.mantleService.getTokenBalance(lpTokenAddress, userAddress);
  }
}

// Create singleton instance
let lendingService: MantleLendingService | null = null;

export function getMantleLendingService() {
  if (!lendingService) {
    lendingService = new MantleLendingService();
  }
  return lendingService;
}

export default MantleLendingService;
