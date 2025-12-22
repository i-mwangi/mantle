/**
 * Deploy Remaining Contracts (Issuer, Lending Pool, LP Token)
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Remaining Contracts to Mantle Sepolia\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT\n");

  // Use already deployed contracts
  const usdcAddress = "0xe96c82aBA229efCC7a46e46D194412C691feD1D5";
  const farmerVerificationAddress = "0xBeBd1F23dB2C0D6636bc311A44030123906129A5";
  const priceOracleAddress = "0xD9842968C7c80242d7BeC5dA986DC4f66d20D5a8";
  const coffeeTokenAddress = "0xdA30154f6b904aeE05c11A2abd06FCDb9b625494"; // L2 Coffee Tree Token

  console.log("📦 Using Already Deployed Contracts:");
  console.log("   USDC:", usdcAddress);
  console.log("   Farmer Verification:", farmerVerificationAddress);
  console.log("   Price Oracle:", priceOracleAddress);
  console.log("");

  // Deploy Coffee Tree Issuer (Simple version)
  console.log("🌳 Deploying Coffee Tree Issuer (Simple)...");
  const CoffeeTreeIssuerSimple = await ethers.getContractFactory("CoffeeTreeIssuerSimple");
  const issuer = await CoffeeTreeIssuerSimple.deploy(
    usdcAddress,
    farmerVerificationAddress,
    priceOracleAddress
  );
  await issuer.waitForDeployment();
  const issuerAddress = await issuer.getAddress();
  console.log("✅ Coffee Tree Issuer:", issuerAddress);
  console.log("");

  // Deploy Lending Pool
  console.log("💰 Deploying Lending Pool...");
  const CoffeeLendingPool = await ethers.getContractFactory("CoffeeLendingPool");
  const lendingPool = await CoffeeLendingPool.deploy(usdcAddress, coffeeTokenAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ Lending Pool:", lendingPoolAddress);
  console.log("");

  // Deploy LP Token
  console.log("🎫 Deploying LP Token...");
  const LPToken = await ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy("Coffee Lending Pool LP Token", "CLPLP");
  await lpToken.waitForDeployment();
  const lpTokenAddress = await lpToken.getAddress();
  console.log("✅ LP Token:", lpTokenAddress);
  console.log("");

  console.log("=".repeat(70));
  console.log("\n✅ All Contracts Deployed!\n");

  // Save addresses
  console.log("📝 Update your .env file with these addresses:\n");
  console.log(`MANTLE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`MANTLE_FARMER_VERIFICATION_ADDRESS=${farmerVerificationAddress}`);
  console.log(`MANTLE_PRICE_ORACLE_ADDRESS=${priceOracleAddress}`);
  console.log(`MANTLE_ISSUER_ADDRESS=${issuerAddress}`);
  console.log(`MANTLE_LENDING_POOL_ADDRESS=${lendingPoolAddress}`);
  console.log(`MANTLE_LP_TOKEN_ADDRESS=${lpTokenAddress}`);
  console.log("");

  // Verification instructions
  console.log("🔍 Verify contracts on Mantle Explorer:");
  console.log(`   npx hardhat verify --network mantleSepolia ${issuerAddress} "${usdcAddress}" "${farmerVerificationAddress}" "${priceOracleAddress}"`);
  console.log(`   npx hardhat verify --network mantleSepolia ${lendingPoolAddress} "${usdcAddress}"`);
  console.log(`   npx hardhat verify --network mantleSepolia ${lpTokenAddress} "${lendingPoolAddress}"`);
  console.log("");

  console.log("🎯 Next Steps:");
  console.log("   1. Update .env with the deployed addresses");
  console.log("   2. Verify contracts on Mantle Explorer");
  console.log("   3. Test tokenization through the UI");
  console.log("   4. Start servers: pnpm run api:mock && pnpm run frontend");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
