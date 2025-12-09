// Generate a new wallet for testing
const { ethers } = require("ethers");

console.log('\n🔐 Generating New Wallet for Testing...\n');
console.log('⚠️  WARNING: This is for TESTNET ONLY!');
console.log('⚠️  DO NOT use this wallet for real funds!\n');

// Generate random wallet
const wallet = ethers.Wallet.createRandom();

console.log('=' .repeat(60));
console.log('📋 Wallet Details:');
console.log('=' .repeat(60));
console.log('\n🔑 Private Key:');
console.log(wallet.privateKey);
console.log('\n📍 Address:');
console.log(wallet.address);
console.log('\n🔤 Mnemonic (12 words):');
console.log(wallet.mnemonic.phrase);
console.log('\n' + '='.repeat(60));

console.log('\n📝 Next Steps:');
console.log('1. Add private key to .env:');
console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
console.log('\n2. Get testnet MNT:');
console.log('   Visit: https://faucet.testnet.mantle.xyz');
console.log(`   Use address: ${wallet.address}`);
console.log('\n3. Deploy contracts:');
console.log('   npx hardhat run scripts/mantle/deploy.ts --network mantleTestnet');
console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT: Save your private key and mnemonic securely!');
console.log('⚠️  Never share them or commit them to git!\n');
