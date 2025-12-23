/**
 * Integrate Lending Pool with Tokenized Groves
 * This script shows how to add coffee tree tokens as collateral
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Integrating Lending Pool with Coffee Tree Tokens\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Using account:", deployer.address);

  // Contract addresses from deployment
  const issuerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const lendingPoolAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Get contract instances
  const issuer = await ethers.getContractAt("CoffeeTreeIssuerSimple", issuerAddress);
  const lendingPool = await ethers.getContractAt("CoffeeLendingPool", lendingPoolAddress);

  console.log("\n📋 Contract Addresses:");
  console.log("   Issuer:", issuerAddress);
  console.log("   Lending Pool:", lendingPoolAddress);
  console.log("");

  // Step 1: Set lending pool in issuer
  console.log("🔧 Step 1: Linking Issuer to Lending Pool...");
  const setPoolTx = await issuer.setLendingPool(lendingPoolAddress);
  await setPoolTx.wait();
  console.log("✅ Lending pool linked to issuer");
  console.log("");

  // Step 2: Get all tokenized groves
  console.log("🌳 Step 2: Finding Tokenized Groves...");
  const groveCount = await issuer.getGroveCount();
  console.log(`   Found ${groveCount} registered groves`);
  
  const allGroves = await issuer.getAllGroves();
  const tokenizedGroves = [];
  
  for (let i = 0; i < allGroves.length; i++) {
    const groveName = allGroves[i];
    const grove = await issuer.getGroveInfo(groveName);
    
    if (grove.isTokenized) {
      tokenizedGroves.push({
        name: groveName,
        tokenAddress: grove.tokenAddress,
        farmer: grove.farmer,
        location: grove.location
      });
      console.log(`   ✓ ${groveName}: ${grove.tokenAddress}`);
    }
  }
  console.log("");

  // Step 3: Add tokens as collateral
  if (tokenizedGroves.length > 0) {
    console.log("💎 Step 3: Adding Tokens as Collateral...");
    
    for (const grove of tokenizedGroves) {
      const isSupported = await lendingPool.isCollateralSupported(grove.tokenAddress);
      
      if (!isSupported) {
        console.log(`   Adding ${grove.name} token...`);
        const addTx = await lendingPool.addCollateralToken(grove.tokenAddress);
        await addTx.wait();
        console.log(`   ✅ ${grove.name} token added as collateral`);
      } else {
        console.log(`   ⏭️  ${grove.name} token already supported`);
      }
    }
    console.log("");
  } else {
    console.log("⚠️  No tokenized groves found. Tokenize a grove first!");
    console.log("");
  }

  // Step 4: Display lending pool info
  console.log("📊 Lending Pool Status:");
  const poolStats = await lendingPool.getPoolStats();
  console.log(`   Total Liquidity: ${ethers.formatUnits(poolStats[0], 6)} USDC`);
  console.log(`   Available Liquidity: ${ethers.formatUnits(poolStats[1], 6)} USDC`);
  console.log(`   Total Borrowed: ${ethers.formatUnits(poolStats[2], 6)} USDC`);
  console.log(`   Utilization Rate: ${poolStats[3] / 100}%`);
  console.log(`   Base APY: ${poolStats[4] / 100}%`);
  console.log("");

  const supportedTokens = await lendingPool.getSupportedCollateral();
  console.log(`   Supported Collateral Tokens: ${supportedTokens.length}`);
  for (const token of supportedTokens) {
    console.log(`      - ${token}`);
  }
  console.log("");

  console.log("=".repeat(70));
  console.log("\n✅ Integration Complete!\n");

  console.log("🎯 Next Steps:");
  console.log("   1. Provide liquidity to the lending pool");
  console.log("   2. Farmers can borrow against their coffee tree tokens");
  console.log("   3. Monitor pool utilization and APY");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
