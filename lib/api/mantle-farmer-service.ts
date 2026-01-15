/**
 * Farmer Verification Service for Mantle Network
 * Handles farmer verification and management
 */

import { getMantleService } from './mantle-contract-service.js';
import { FARMER_VERIFICATION_ABI } from './contract-abis.js';
import { db } from '../../db/index.js';
import { farmers } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface VerificationResult {
  success: boolean;
  farmerAddress?: string;
  transactionHash?: string;
  error?: string;
}

export class MantleFarmerService {
  private mantleService = getMantleService();

  /**
   * Verify a farmer
   */
  async verifyFarmer(farmerAddress: string): Promise<VerificationResult> {
    try {
      console.log(`✅ Verifying farmer: ${farmerAddress}...`);

      const receipt = await this.mantleService.executeContract(
        'FARMER_VERIFICATION',
        FARMER_VERIFICATION_ABI,
        'verifyFarmer',
        farmerAddress
      );

      // Update database
      await db.insert(farmers).values({
        address: farmerAddress,
        verified: true,
        verifiedAt: Date.now(),
        verificationTxHash: receipt.hash,
      }).onConflictDoUpdate({
        target: farmers.address,
        set: {
          verified: true,
          verifiedAt: Date.now(),
          verificationTxHash: receipt.hash,
        },
      });

      console.log(`✅ Farmer verified: ${farmerAddress}`);

      return {
        success: true,
        farmerAddress,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      return {
        success: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Revoke farmer verification
   */
  async revokeVerification(farmerAddress: string): Promise<VerificationResult> {
    try {
      console.log(`⚠️ Revoking verification for: ${farmerAddress}...`);

      const receipt = await this.mantleService.executeContract(
        'FARMER_VERIFICATION',
        FARMER_VERIFICATION_ABI,
        'revokeVerification',
        farmerAddress
      );

      // Update database
      await db.update(farmers)
        .set({
          verified: false,
          revokedAt: Date.now(),
          revocationTxHash: receipt.hash,
        })
        .where(eq(farmers.address, farmerAddress));

      console.log(`✅ Verification revoked: ${farmerAddress}`);

      return {
        success: true,
        farmerAddress,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ Revocation failed:', error);
      return {
        success: false,
        error: error.message || 'Revocation failed',
      };
    }
  }

  /**
   * Check if farmer is verified
   */
  async isVerified(farmerAddress: string): Promise<boolean> {
    try {
      const verified = await this.mantleService.callContract(
        'FARMER_VERIFICATION',
        FARMER_VERIFICATION_ABI,
        'isVerified',
        farmerAddress
      );
      return verified;
    } catch (error: any) {
      console.error('❌ Failed to check verification:', error);
      return false;
    }
  }

  /**
   * Get farmer details from database
   */
  async getFarmerDetails(farmerAddress: string) {
    try {
      const farmer = await db.query.farmers.findFirst({
        where: eq(farmers.address, farmerAddress),
      });
      return farmer;
    } catch (error: any) {
      console.error('❌ Failed to get farmer details:', error);
      throw error;
    }
  }

  /**
   * Get all verified farmers
   */
  async getVerifiedFarmers() {
    try {
      const verifiedFarmers = await db.query.farmers.findMany({
        where: eq(farmers.verificationStatus, 'verified'),
      });
      return verifiedFarmers;
    } catch (error: any) {
      console.error('❌ Failed to get verified farmers:', error);
      throw error;
    }
  }

  /**
   * Register farmer in database (before verification)
   */
  async registerFarmer(farmerData: {
    address: string;
    name?: string;
    location?: string;
    email?: string;
  }) {
    try {
      await db.insert(farmers).values({
        address: farmerData.address,
        name: farmerData.name,
        location: farmerData.location,
        email: farmerData.email,
        verified: false,
        createdAt: Date.now(),
      }).onConflictDoUpdate({
        target: farmers.address,
        set: {
          name: farmerData.name,
          location: farmerData.location,
          email: farmerData.email,
        },
      });

      console.log(`✅ Farmer registered: ${farmerData.address}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
let farmerService: MantleFarmerService | null = null;

export function getMantleFarmerService() {
  if (!farmerService) {
    farmerService = new MantleFarmerService();
  }
  return farmerService;
}

export default MantleFarmerService;
