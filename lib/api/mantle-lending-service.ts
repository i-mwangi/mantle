/**
 * Lending Service for Mantle Network
 * Handles lending pool operations, deposits, withdrawals, loans
 */

import { getMantleService } from './mantle-contract-service.js';
import { LENDING_POOL_ABI, LP_TOKEN_ABI, USDC_ABI, GROVE_TOKEN_ABI } from './contract-abis.js';
import { ethers } from 'ethers';
import { db } from '../../db/index.js';
import { providedLiquidity, withdrawnLiquidity, lendingLoans, lendingLoanPayments } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

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
  borrowedAmount?: string;
  collateralAmount?: string;
  repayAmount?: string;
  transactionHash?: string;
  error?: string;
}

export interface RepayResult {
  success: boolean;
  repaidAmount?: string;
  transactionHash?: string;
  error?: string;
}

export class MantleLendingService {
  private mantleService = getMantleService();

  /**
   * Deposit USDC into lending pool and receive LP tokens
   * User will see LP tokens in MetaMask after this
   */
  async deposit(userAddress: string, amount: string): Promise<DepositResult> {
    try {
      console.log(`💰 Depositing ${amount} USDC to lending pool...`);

      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      // Get contracts
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);

      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Step 1: Approve USDC spending
      console.log('📝 Approving USDC...');
      const approveTx = await usdcContract.approve(lendingPoolAddress, amountWei);
      await approveTx.wait();
      console.log('✅ USDC approved');

      // Step 2: Provide liquidity (this will mint LP tokens to user)
      console.log('💰 Providing liquidity...');
      const depositTx = await lendingPoolContract.provideLiquidity(amountWei);
      const receipt = await depositTx.wait();
      console.log('✅ Liquidity provided');

      // Step 3: Get LP token balance to see how many were received
      const lpTokenAddress = await lendingPoolContract.getLPToken();
      const lpTokenContract = this.mantleService.getContractByAddress(lpTokenAddress, LP_TOKEN_ABI);
      const lpBalance = await lpTokenContract.balanceOf(userAddress);
      const lpDecimals = await lpTokenContract.decimals();
      const lpTokensReceived = ethers.formatUnits(lpBalance, lpDecimals);

      // Step 4: Record in database (skip if foreign key constraint fails)
      try {
        await db.insert(providedLiquidity).values({
          id: `${userAddress}-${Date.now()}`,
          account: userAddress.toLowerCase(),
          asset: process.env.MANTLE_USDC_ADDRESS!,
          amount: parseFloat(amount),
          timestamp: Date.now(),
        });
      } catch (dbError: any) {
        console.warn('⚠️  Database insert failed (foreign key constraint), but blockchain transaction succeeded:', dbError.message);
        // Continue anyway - the blockchain transaction succeeded
      }

      console.log(`✅ Deposited ${amount} USDC, received ${lpTokensReceived} LP tokens`);
      console.log(`📊 LP tokens are now visible in MetaMask at: ${lpTokenAddress}`);

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
   * Withdraw USDC from lending pool by burning LP tokens
   * LP tokens will decrease in MetaMask, USDC will increase
   */
  async withdraw(userAddress: string, lpTokenAmount: string): Promise<WithdrawResult> {
    try {
      console.log(`💸 Withdrawing ${lpTokenAmount} LP tokens from lending pool...`);

      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const lpTokenAddress = await lendingPoolContract.getLPToken();
      const lpTokenContract = this.mantleService.getContractByAddress(lpTokenAddress, LP_TOKEN_ABI);

      const lpDecimals = await lpTokenContract.decimals();
      const lpAmountWei = ethers.parseUnits(lpTokenAmount, lpDecimals);

      // Check LP token balance
      const lpBalance = await lpTokenContract.balanceOf(userAddress);
      if (lpBalance < lpAmountWei) {
        throw new Error('Insufficient LP token balance');
      }

      // Withdraw liquidity (this will burn LP tokens and send USDC)
      console.log('💸 Withdrawing liquidity...');
      const withdrawTx = await lendingPoolContract.withdrawLiquidity(lpAmountWei);
      const receipt = await withdrawTx.wait();
      console.log('✅ Liquidity withdrawn');

      // Parse event to get USDC amount received
      const withdrawEvent = receipt.logs
        .map((log: any) => {
          try {
            return lendingPoolContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'LiquidityWithdrawn');

      const usdcAmount = withdrawEvent 
        ? ethers.formatUnits(withdrawEvent.args.amount, 6)
        : '0';

      // Record in database (skip if foreign key constraint fails)
      try {
        await db.insert(withdrawnLiquidity).values({
          id: `${userAddress}-${Date.now()}`,
          account: userAddress.toLowerCase(),
          asset: process.env.MANTLE_USDC_ADDRESS!,
          amount: parseFloat(usdcAmount),
          timestamp: Date.now(),
        });
      } catch (dbError: any) {
        console.warn('⚠️  Database insert failed (foreign key constraint), but blockchain transaction succeeded:', dbError.message);
        // Continue anyway - the blockchain transaction succeeded
      }

      console.log(`✅ Withdrew ${lpTokenAmount} LP tokens, received ${usdcAmount} USDC`);
      console.log(`📊 USDC balance increased in MetaMask`);

      return {
        success: true,
        amount: usdcAmount,
        lpTokensBurned: lpTokenAmount,
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
   * USDC will increase in MetaMask after this
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

      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      // Get contracts
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const collateralContract = this.mantleService.getContractByAddress(
        collateralTokenAddress,
        GROVE_TOKEN_ABI
      );

      // Check if collateral token is supported
      const isSupported = await lendingPoolContract.isCollateralSupported(collateralTokenAddress);
      if (!isSupported) {
        throw new Error('Collateral token not supported. Admin needs to add it first.');
      }

      // Parse amounts
      const collateralDecimals = await collateralContract.decimals();
      const collateralWei = ethers.parseUnits(collateralAmount, collateralDecimals);
      const borrowWei = ethers.parseUnits(borrowAmount, 6); // USDC has 6 decimals

      // Check collateral balance
      const collateralBalance = await collateralContract.balanceOf(borrowerAddress);
      if (collateralBalance < collateralWei) {
        throw new Error('Insufficient collateral token balance');
      }

      // Step 1: Approve collateral token
      console.log('📝 Approving collateral...');
      const approveTx = await collateralContract.approve(lendingPoolAddress, collateralWei);
      await approveTx.wait();
      console.log('✅ Collateral approved');

      // Step 2: Take loan (this will transfer USDC to borrower)
      console.log('🏦 Taking loan...');
      const borrowTx = await lendingPoolContract.takeLoan(
        collateralTokenAddress,
        collateralWei,
        borrowWei
      );
      const receipt = await borrowTx.wait();
      console.log('✅ Loan taken');

      // Parse event to get loan details
      const loanEvent = receipt.logs
        .map((log: any) => {
          try {
            return lendingPoolContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'LoanTaken');

      const repayAmount = loanEvent 
        ? ethers.formatUnits(loanEvent.args.repayAmount, 6)
        : (parseFloat(borrowAmount) * 1.1).toFixed(2); // 10% interest

      // Record in database
      await db.insert(lendingLoans).values({
        loanId: `${borrowerAddress}-${Date.now()}`,
        borrowerAccount: borrowerAddress.toLowerCase(),
        assetAddress: process.env.MANTLE_USDC_ADDRESS!,
        loanAmountUsdc: parseFloat(borrowAmount),
        collateralAmount: parseFloat(collateralAmount),
        collateralTokenId: collateralTokenAddress,
        repaymentAmount: parseFloat(repayAmount),
        interestRate: 0.10, // 10%
        collateralizationRatio: 1.25, // 125%
        status: 'active',
        takenAt: Date.now(),
      });

      console.log(`✅ Borrowed ${borrowAmount} USDC, must repay ${repayAmount} USDC`);
      console.log(`📊 USDC balance increased in MetaMask`);
      console.log(`🔒 Collateral locked in lending pool`);

      return {
        success: true,
        borrowedAmount: borrowAmount,
        collateralAmount,
        repayAmount,
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
   * Repay loan and get collateral back
   * USDC will decrease in MetaMask, collateral tokens will be returned
   */
  async repay(borrowerAddress: string): Promise<RepayResult> {
    try {
      console.log(`💳 Repaying loan for ${borrowerAddress}...`);

      const lendingPoolAddress = process.env.MANTLE_LENDING_POOL_ADDRESS;
      if (!lendingPoolAddress) {
        throw new Error('Lending pool address not configured');
      }

      // Get contracts
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const usdcContract = this.mantleService.getContract('USDC', USDC_ABI);

      // Get loan details
      const loan = await lendingPoolContract.getLoan(borrowerAddress);
      if (!loan.isActive) {
        throw new Error('No active loan found');
      }

      const repayAmount = ethers.formatUnits(loan.repayAmount, 6);
      const repayWei = loan.repayAmount;

      // Check USDC balance
      const usdcBalance = await usdcContract.balanceOf(borrowerAddress);
      if (usdcBalance < repayWei) {
        throw new Error(`Insufficient USDC balance. Need ${repayAmount} USDC`);
      }

      // Step 1: Approve USDC
      console.log('📝 Approving USDC...');
      const approveTx = await usdcContract.approve(lendingPoolAddress, repayWei);
      await approveTx.wait();
      console.log('✅ USDC approved');

      // Step 2: Repay loan (this will return collateral to borrower)
      console.log('💳 Repaying loan...');
      const repayTx = await lendingPoolContract.repayLoan();
      const receipt = await repayTx.wait();
      console.log('✅ Loan repaid');

      // Update database
      await db.update(lendingLoans)
        .set({
          status: 'repaid',
          repaidAt: Date.now(),
        })
        .where(
          and(
            eq(lendingLoans.borrowerAccount, borrowerAddress.toLowerCase()),
            eq(lendingLoans.status, 'active')
          )
        );

      // Record payment
      await db.insert(lendingLoanPayments).values({
        paymentId: `${borrowerAddress}-${Date.now()}`,
        loanId: `${borrowerAddress}`,
        borrowerAccount: borrowerAddress.toLowerCase(),
        amountPaid: parseFloat(repayAmount),
        paidAt: Date.now(),
      });

      console.log(`✅ Repaid ${repayAmount} USDC`);
      console.log(`📊 USDC balance decreased in MetaMask`);
      console.log(`🔓 Collateral returned to wallet`);

      return {
        success: true,
        repaidAmount: repayAmount,
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
   * Get pool statistics
   */
  async getPoolStats() {
    try {
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const stats = await lendingPoolContract.getPoolStats();

      return {
        totalLiquidity: ethers.formatUnits(stats._totalLiquidity, 6),
        availableLiquidity: ethers.formatUnits(stats._availableLiquidity, 6),
        totalBorrowed: ethers.formatUnits(stats._totalBorrowed, 6),
        utilizationRate: Number(stats._utilizationRate) / 100, // Convert from basis points
        currentAPY: Number(stats._currentAPY) / 100, // Convert from basis points
      };
    } catch (error: any) {
      console.error('❌ Failed to get pool stats:', error);
      throw error;
    }
  }

  /**
   * Get user's liquidity position
   */
  async getLiquidityPosition(userAddress: string) {
    try {
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const position = await lendingPoolContract.getLiquidityPosition(userAddress);

      return {
        amountProvided: ethers.formatUnits(position.amountProvided, 6),
        lpTokensReceived: ethers.formatUnits(position.lpTokensReceived, 18),
        depositDate: Number(position.depositDate) * 1000, // Convert to milliseconds
        accruedInterest: ethers.formatUnits(position.accruedInterest, 6),
      };
    } catch (error: any) {
      console.error('❌ Failed to get liquidity position:', error);
      throw error;
    }
  }

  /**
   * Get user's active loan
   */
  async getLoan(borrowerAddress: string) {
    try {
      const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
      const loan = await lendingPoolContract.getLoan(borrowerAddress);

      if (!loan.isActive) {
        return null;
      }

      return {
        collateralToken: loan.collateralToken,
        loanAmount: ethers.formatUnits(loan.loanAmount, 6),
        collateralAmount: ethers.formatUnits(loan.collateralAmount, 18),
        repayAmount: ethers.formatUnits(loan.repayAmount, 6),
        borrowDate: Number(loan.borrowDate) * 1000, // Convert to milliseconds
        isActive: loan.isActive,
        isLiquidated: loan.isLiquidated,
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
    const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
    return await lendingPoolContract.getLPToken();
  }

  /**
   * Get LP token balance
   */
  async getLPTokenBalance(userAddress: string): Promise<string> {
    const lpTokenAddress = await this.getLPTokenAddress();
    return await this.mantleService.getTokenBalance(lpTokenAddress, userAddress);
  }

  /**
   * Get supported collateral tokens
   */
  async getSupportedCollateral(): Promise<string[]> {
    const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
    return await lendingPoolContract.getSupportedCollateral();
  }

  /**
   * Calculate max loan amount for given collateral
   */
  async getMaxLoanAmount(collateralToken: string, collateralAmount: string): Promise<string> {
    const lendingPoolContract = this.mantleService.getContract('LENDING_POOL', LENDING_POOL_ABI);
    const collateralContract = this.mantleService.getContractByAddress(collateralToken, GROVE_TOKEN_ABI);
    
    const decimals = await collateralContract.decimals();
    const collateralWei = ethers.parseUnits(collateralAmount, decimals);
    
    const maxLoan = await lendingPoolContract.getMaxLoanAmount(collateralToken, collateralWei);
    return ethers.formatUnits(maxLoan, 6);
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
