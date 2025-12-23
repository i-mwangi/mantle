/**
 * Debug Issuer Contract Configuration
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const ISSUER_ABI = [
  "function admin() external view returns (address)",
  "function USDC() external view returns (address)",
  "function oracle() external view returns (address)",
  "function farmerVerification() external view returns (address)"
];

async function debug() {
  console.log('🔍 Debugging Issuer Contract\n');

  const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('📍 Your Wallet:', wallet.address);
  console.log('🔗 Issuer Contract:', process.env.MANTLE_ISSUER_ADDRESS);
  console.log('');

  const issuer = new ethers.Contract(
    process.env.MANTLE_ISSUER_ADDRESS,
    ISSUER_ABI,
    provider
  );

  console.log('📋 Contract Configuration:');
  const admin = await issuer.admin();
  console.log('   Admin:', admin);
  console.log('   Is Admin:', admin.toLowerCase() === wallet.address.toLowerCase());
  
  const usdc = await issuer.USDC();
  console.log('   USDC:', usdc);
  console.log('   Expected:', process.env.MANTLE_USDC_ADDRESS);
  console.log('   Match:', usdc.toLowerCase() === process.env.MANTLE_USDC_ADDRESS.toLowerCase());
  
  const oracle = await issuer.oracle();
  console.log('   Oracle:', oracle);
  console.log('   Expected:', process.env.MANTLE_PRICE_ORACLE_ADDRESS);
  console.log('   Match:', oracle.toLowerCase() === process.env.MANTLE_PRICE_ORACLE_ADDRESS.toLowerCase());
  
  const farmerVerification = await issuer.farmerVerification();
  console.log('   Farmer Verification:', farmerVerification);
  console.log('   Expected:', process.env.MANTLE_FARMER_VERIFICATION_ADDRESS);
  console.log('   Match:', farmerVerification.toLowerCase() === process.env.MANTLE_FARMER_VERIFICATION_ADDRESS.toLowerCase());
  console.log('');

  // Now check if farmer is verified according to the contract
  const FARMER_VERIFICATION_ABI = [
    "function isVerifiedFarmer(address farmer) external view returns (bool)"
  ];
  
  const farmerVerificationContract = new ethers.Contract(
    farmerVerification,
    FARMER_VERIFICATION_ABI,
    provider
  );
  
  const isVerified = await farmerVerificationContract.isVerifiedFarmer(wallet.address);
  console.log('✅ Farmer Verified (from issuer\'s perspective):', isVerified);
}

debug();
