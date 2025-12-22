/**
 * Deploy Coffee Tree Tokens using Mantle Standard Bridge Pattern
 * Following: https://github.com/mantlenetworkio/mantle-tutorial
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// Mantle L2 Standard Token Factory (Predeploy)
const L2_STANDARD_TOKEN_FACTORY = "0x4200000000000000000000000000000000000012";

// Mantle L2 Standard Bridge (Predeploy)
const L2_STANDARD_BRIDGE = "0x4200000000000000000000000000000000000010";

async function main() {
  console.log("🚀 Deploying Coffee Tree Tokens to Mantle using Standard Bridge Pattern\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("");

  // Deploy using Standard Token Factory (for simple tokens)
  console.log("📝 Using Mantle L2 Standard Token Factory");
  console.log("   Factory Address:", L2_STANDARD_TOKEN_FACTORY);
  console.log("   Bridge Address:", L2_STANDARD_BRIDGE);
  console.log("");

  // For custom tokens with grove metadata, we deploy directly
  console.log("🌳 Deploying Custom L2 Coffee Tree Token...\n");

  const L2CoffeeTreeToken = await ethers.getContractFactory("L2CoffeeTreeToken");
  
  const coffeeToken = await L2CoffeeTreeToken.deploy(
    L2_STANDARD_BRIDGE,           // _l2Bridge
    ethers.ZeroAddress,           // _l1Token (set to zero if no L1 token yet)
    "Sunrise Grove Token",        // _name
    "SUNRISE",                    // _symbol
    "Sunrise Coffee Grove",       // _groveName
    "Colombia, Huila",            // _location
    "Arabica Caturra",            // _coffeeVariety
    1000                          // _expectedYield (kg per season)
  );

  await coffeeToken.waitForDeployment();
  const coffeeTokenAddress = await coffeeToken.getAddress();

  console.log("✅ L2 Coffee Tree Token deployed!");
  console.log("   Address:", coffeeTokenAddress);
  console.log("   Name:", await coffeeToken.name());
  console.log("   Symbol:", await coffeeToken.symbol());
  console.log("   Grove:", await coffeeToken.groveName());
  console.log("   Location:", await coffeeToken.location());
  console.log("");

  // Deploy USDC token (standard ERC20 for payments)
  console.log("💵 Deploying USDC Token...\n");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  console.log("✅ USDC Token deployed!");
  console.log("   Address:", usdcAddress);
  console.log("");

  // Deploy other core contracts
  console.log("📦 Deploying Core Contracts...\n");

  // 1. Farmer Verification
  const FarmerVerification = await ethers.getContractFactory("FarmerVerification");
  const farmerVerification = await FarmerVerification.deploy();
  await farmerVerification.waitForDeployment();
  const farmerVerificationAddress = await farmerVerification.getAddress();
  console.log("✅ Farmer Verification:", farmerVerificationAddress);

  // 2. Price Oracle
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("✅ Price Oracle:", priceOracleAddress);

  // 3. Coffee Tree Issuer (Simple version to avoid size limit)
  const CoffeeTreeIssuerSimple = await ethers.getContractFactory("CoffeeTreeIssuerSimple");
  const issuer = await CoffeeTreeIssuerSimple.deploy(
    usdcAddress,
    farmerVerificationAddress,
    priceOracleAddress
  );
  await issuer.waitForDeployment();
  const issuerAddress = await issuer.getAddress();
  console.log("✅ Coffee Tree Issuer (Simple):", issuerAddress);

  // 4. Lending Pool
  const CoffeeLendingPool = await ethers.getContractFactory("CoffeeLendingPool");
  const lendingPool = await CoffeeLendingPool.deploy(usdcAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ Lending Pool:", lendingPoolAddress);

  // 5. LP Token
  const LPToken = await ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy(lendingPoolAddress);
  await lpToken.waitForDeployment();
  const lpTokenAddress = await lpToken.getAddress();
  console.log("✅ LP Token:", lpTokenAddress);

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ Deployment Complete!\n");

  // Save addresses to .env format
  console.log("📝 Add these to your .env file:\n");
  console.log(`MANTLE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`MANTLE_FARMER_VERIFICATION_ADDRESS=${farmerVerificationAddress}`);
  console.log(`MANTLE_PRICE_ORACLE_ADDRESS=${priceOracleAddress}`);
  console.log(`MANTLE_ISSUER_ADDRESS=${issuerAddress}`);
  console.log(`MANTLE_LENDING_POOL_ADDRESS=${lendingPoolAddress}`);
  console.log(`MANTLE_LP_TOKEN_ADDRESS=${lpTokenAddress}`);
  console.log(`MANTLE_COFFEE_TOKEN_ADDRESS=${coffeeTokenAddress}`);
  console.log("");

  // Verification instructions
  if (network.chainId === 5003n) {
    console.log("🔍 Verify contracts on Mantle Explorer:");
    console.log(`   npx hardhat verify --network mantleSepolia ${coffeeTokenAddress} "${L2_STANDARD_BRIDGE}" "${ethers.ZeroAddress}" "Sunrise Grove Token" "SUNRISE" "Sunrise Coffee Grove" "Colombia, Huila" "Arabica Caturra" 1000`);
    console.log("");
  }

  console.log("🎯 Next Steps:");
  console.log("   1. Update .env with the deployed addresses");
  console.log("   2. Verify contracts on Mantle Explorer");
  console.log("   3. Test tokenization through the UI");
  console.log("   4. Bridge tokens if needed using Mantle Standard Bridge");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
