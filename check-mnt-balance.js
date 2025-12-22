import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Checking balance for:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'MNT');
}

checkBalance();
