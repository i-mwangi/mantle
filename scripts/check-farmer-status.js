/**
 * Check Farmer Verification Status
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const FARMER_VERIFICATION_ABI = [
  "function isVerifiedFarmer(address farmer) external view returns (bool)",
  "function getFarmerProfile(address farmer) external view returns (tuple(address farmerAddress, string name, string location, string contactInfo, bool isVerified, uint256 verificationDate, string verificationDocumentHash))"
];

async function checkStatus() {
  console.log('🔍 Checking Farmer Verification Status\n');

  const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('📍 Wallet:', wallet.address);
  console.log('🔗 Contract:', process.env.MANTLE_FARMER_VERIFICATION_ADDRESS);
  console.log('');

  const contract = new ethers.Contract(
    process.env.MANTLE_FARMER_VERIFICATION_ADDRESS,
    FARMER_VERIFICATION_ABI,
    provider
  );

  const isVerified = await contract.isVerifiedFarmer(wallet.address);
  console.log('✅ Is Verified:', isVerified);
  console.log('');

  const profile = await contract.getFarmerProfile(wallet.address);
  console.log('👤 Farmer Profile:');
  console.log('   Address:', profile.farmerAddress);
  console.log('   Name:', profile.name);
  console.log('   Location:', profile.location);
  console.log('   Contact:', profile.contactInfo);
  console.log('   Verified:', profile.isVerified);
  console.log('   Verification Date:', profile.verificationDate.toString());
  console.log('   Document Hash:', profile.verificationDocumentHash);
}

checkStatus();
