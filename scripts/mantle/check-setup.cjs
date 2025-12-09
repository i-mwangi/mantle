// Check if environment is ready for deployment
require('dotenv').config();

console.log('\n🔍 Checking Mantle Deployment Setup...\n');

let allGood = true;

// Check 1: Private Key
if (process.env.PRIVATE_KEY) {
  console.log('✅ PRIVATE_KEY found in .env');
} else {
  console.log('❌ PRIVATE_KEY not found in .env');
  console.log('   Add your wallet private key to .env:');
  console.log('   PRIVATE_KEY=your_private_key_here\n');
  allGood = false;
}

// Check 2: RPC URL
if (process.env.MANTLE_RPC_URL) {
  console.log('✅ MANTLE_RPC_URL configured:', process.env.MANTLE_RPC_URL);
} else {
  console.log('⚠️  MANTLE_RPC_URL not set, using default: https://rpc.testnet.mantle.xyz');
}

// Check 3: Node modules
const fs = require('fs');
if (fs.existsSync('node_modules')) {
  console.log('✅ Dependencies installed');
} else {
  console.log('❌ Dependencies not installed');
  console.log('   Run: pnpm install\n');
  allGood = false;
}

// Check 4: Contracts compiled
if (fs.existsSync('artifacts/hardhat')) {
  console.log('✅ Contracts compiled');
} else {
  console.log('⚠️  Contracts not compiled yet');
  console.log('   Run: npx hardhat compile\n');
}

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('🎉 Setup complete! Ready to deploy.');
  console.log('\n📋 Next steps:');
  console.log('1. Get testnet MNT: https://faucet.testnet.mantle.xyz');
  console.log('2. Compile contracts: npx hardhat compile');
  console.log('3. Deploy: npx hardhat run scripts/mantle/deploy.ts --network mantleTestnet');
} else {
  console.log('⚠️  Setup incomplete. Please fix the issues above.');
}

console.log('='.repeat(60) + '\n');
