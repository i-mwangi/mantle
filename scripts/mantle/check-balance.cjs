// Check wallet balance on Mantle Testnet
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  console.log('\n💰 Checking Wallet Balance...\n');
  
  if (!process.env.PRIVATE_KEY) {
    console.log('❌ PRIVATE_KEY not found in .env');
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(
    process.env.MANTLE_RPC_URL || 'https://rpc.testnet.mantle.xyz'
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('📍 Address:', wallet.address);
  
  try {
    const balance = await provider.getBalance(wallet.address);
    const balanceMNT = ethers.formatEther(balance);
    
    console.log('💵 Balance:', balanceMNT, 'MNT');
    
    if (parseFloat(balanceMNT) === 0) {
      console.log('\n⚠️  No MNT found!');
      console.log('Get testnet MNT from: https://faucet.testnet.mantle.xyz');
      console.log('Use address:', wallet.address);
    } else if (parseFloat(balanceMNT) < 0.01) {
      console.log('\n⚠️  Low balance! You might need more MNT for deployment.');
      console.log('Get more from: https://faucet.testnet.mantle.xyz');
    } else {
      console.log('\n✅ Sufficient balance for deployment!');
      console.log('Ready to deploy contracts.');
    }
    
  } catch (error) {
    console.log('❌ Error checking balance:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

main();
