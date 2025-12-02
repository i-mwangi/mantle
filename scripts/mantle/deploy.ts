import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting Chai Platform deployment to Mantle...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT\n");
  
  // 1. Deploy MockUSDC (for testnet - use real USDC on mainnet)
  console.log("1️⃣  Deploying MockUSDC...");
  const MockUSDC = await ethers.deployContract("MockUSDC");
  await MockUSDC.waitForDeployment();
  const usdcAddress = await MockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress, "\n");
  
  // 2. Deploy FarmerVerification
  console.log("2️⃣  Deploying FarmerVerification...");
  const FarmerVerification = await ethers.deployContract("FarmerVerification");
  await FarmerVerification.waitForDeployment();
  const farmerVerificationAddress = await FarmerVerification.getAddress();
  console.log("✅ FarmerVerification deployed to:", farmerVerificationAddress, "\n");
  
  // 3. Deploy PriceOracle
  console.log("3️⃣  Deploying PriceOracle...");
  const PriceOracle = await ethers.deployContract("PriceOracle");
  await PriceOracle.waitForDeployment();
  const oracleAddress = await PriceOracle.getAddress();
  console.log("✅ PriceOracle deployed to:", oracleAddress, "\n");
  
  // 4. Deploy CoffeeTreeIssuer
  console.log("4️⃣  Deploying CoffeeTreeIssuer...");
  const CoffeeTreeIssuer = await ethers.deployContract("CoffeeTreeIssuer", [
    farmerVerificationAddress,
    usdcAddress,
    oracleAddress
  ]);
  await CoffeeTreeIssuer.waitForDeployment();
  const issuerAddress = await CoffeeTreeIssuer.getAddress();
  console.log("✅ CoffeeTreeIssuer deployed to:", issuerAddress, "\n");
  
  // 5. Deploy CoffeeLendingPool (with zero address for now, will be set per grove)
  console.log("5️⃣  Deploying CoffeeLendingPool...");
  const CoffeeLendingPool = await ethers.deployContract("CoffeeLendingPool", [
    usdcAddress,
    ethers.ZeroAddress // Will be set when grove is tokenized
  ]);
  await CoffeeLendingPool.waitForDeployment();
  const lendingPoolAddress = await CoffeeLendingPool.getAddress();
  console.log("✅ CoffeeLendingPool deployed to:", lendingPoolAddress, "\n");
  
  // 6. Create LP Token
  console.log("6️⃣  Creating LP Token...");
  const createLPTx = await CoffeeLendingPool.createLPToken("Chai Liquidity Provider", "CHAI-LP");
  await createLPTx.wait();
  const lpTokenAddress = await CoffeeLendingPool.getLPToken();
  console.log("✅ LP Token created at:", lpTokenAddress, "\n");
  
  // Summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      USDC: usdcAddress,
      FarmerVerification: farmerVerificationAddress,
      PriceOracle: oracleAddress,
      CoffeeTreeIssuer: issuerAddress,
      CoffeeLendingPool: lendingPoolAddress,
      LPToken: lpTokenAddress
    }
  };
  
  console.log("\n📋 Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));
  
  console.log("\n💾 Save these addresses to your .env file:");
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  console.log(`FARMER_VERIFICATION_ADDRESS=${farmerVerificationAddress}`);
  console.log(`PRICE_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`ISSUER_ADDRESS=${issuerAddress}`);
  console.log(`LENDING_POOL_ADDRESS=${lendingPoolAddress}`);
  console.log(`LP_TOKEN_ADDRESS=${lpTokenAddress}`);
  
  console.log("\n🔍 Verify contracts on explorer:");
  console.log(`npx hardhat verify --network mantleTestnet ${usdcAddress}`);
  console.log(`npx hardhat verify --network mantleTestnet ${farmerVerificationAddress}`);
  console.log(`npx hardhat verify --network mantleTestnet ${oracleAddress}`);
  console.log(`npx hardhat verify --network mantleTestnet ${issuerAddress} ${farmerVerificationAddress} ${usdcAddress} ${oracleAddress}`);
  console.log(`npx hardhat verify --network mantleTestnet ${lendingPoolAddress} ${usdcAddress} ${ethers.ZeroAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
