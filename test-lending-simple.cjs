/**
 * Simple Lending Pool Test - Deploys and Tests Everything Fresh
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Simple Lending Pool Integration Test\n");
  console.log("=".repeat(80));

  const [deployer, farmer, investor, borrower] = await ethers.getSigners();
  
  console.log("\n👥 Test Accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Farmer: ${farmer.address}`);
  console.log(`   Investor: ${investor.address}`);
  console.log(`   Borrower: ${borrower.address}\n`);

  // ============================================================================
  // DEPLOY ALL CONTRACTS
  // ============================================================================
  console.log("📦 Deploying Contracts...");
  console.log("-".repeat(80));

  // Deploy Mock USDC
  console.log("1. Deploying Mock USDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log(`   ✅ USDC: ${await usdc.getAddress()}`);

  // Deploy Farmer Verification
  console.log("2. Deploying Farmer Verification...");
  const FarmerVerification = await ethers.getContractFactory("FarmerVerification");
  const farmerVerification = await FarmerVerification.deploy();
  await farmerVerification.waitForDeployment();
  console.log(`   ✅ Farmer Verification: ${await farmerVerification.getAddress()}`);

  // Deploy Price Oracle
  console.log("3. Deploying Price Oracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  console.log(`   ✅ Price Oracle: ${await oracle.getAddress()}`);

  // Deploy Issuer
  console.log("4. Deploying Coffee Tree Issuer...");
  const CoffeeTreeIssuerSimple = await ethers.getContractFactory("CoffeeTreeIssuerSimple");
  const issuer = await CoffeeTreeIssuerSimple.deploy(
    await farmerVerification.getAddress(),
    await usdc.getAddress(),
    await oracle.getAddress()
  );
  await issuer.waitForDeployment();
  console.log(`   ✅ Issuer: ${await issuer.getAddress()}`);
  // Deploy Lending Pool
  console.log("5. Deploying Lending Pool...");
  const CoffeeLendingPool = await ethers.getContractFactory("CoffeeLendingPool");
  const lendingPool = await CoffeeLendingPool.deploy(
    await usdc.getAddress(),
    await oracle.getAddress()
  );
  await lendingPool.waitForDeployment();
  console.log(`   ✅ Lending Pool: ${await lendingPool.getAddress()}`);

  const lpTokenAddress = await lendingPool.getLPToken();
  console.log(`   ✅ LP Token: ${lpTokenAddress}`);
  console.log("");

  // ============================================================================
  // TEST 1: Verify Farmer
  // ============================================================================
  console.log("TEST 1: Register and Verify Farmer");
  console.log("-".repeat(80));
  
  // Farmer registers themselves
  const registerTx = await farmerVerification.connect(farmer).registerFarmer(
    "Test Farmer",
    "Kenya",
    "test@farmer.com"
  );
  await registerTx.wait();
  console.log("✅ Farmer registered");
  
  // Admin verifies the farmer
  const verifyTx = await farmerVerification.verifyFarmer(
    farmer.address,
    "ipfs://QmTest123" // Document hash
  );
  await verifyTx.wait();
  console.log("✅ Farmer verified\n");

  // ============================================================================
  // TEST 2: Register and Tokenize Grove
  // ============================================================================
  console.log("TEST 2: Register and Tokenize Grove");
  console.log("-".repeat(80));
  
  const groveName = "Nyeri Coffee Grove";
  
  const groveRegisterTx = await issuer.connect(farmer).registerCoffeeGrove(
    groveName,
    "Kenya, Nyeri",
    100, // 100 trees
    "Arabica SL28",
    50 // 50kg per tree
  );
  await groveRegisterTx.wait();
  console.log("✅ Grove registered");

  const tokenizeTx = await issuer.connect(farmer).tokenizeCoffeeGrove(
    groveName,
    10 // 10 tokens per tree = 1000 total
  );
  await tokenizeTx.wait();
  console.log("✅ Grove tokenized");

  const groveTokenAddress = await issuer.getGroveTokenAddress(groveName);
  console.log(`   Token: ${groveTokenAddress}`);
  
  // Set token price (admin action)
  await oracle.setTokenPrice(groveTokenAddress, ethers.parseUnits("1", 6)); // 1 USDC per token
  console.log("✅ Token price set");
  
  const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
  const totalSupply = await token.totalSupply();
  console.log(`   Supply: ${totalSupply} tokens\n`);

  // ============================================================================
  // TEST 3: Link Issuer to Lending Pool
  // ============================================================================
  console.log("TEST 3: Link Issuer to Lending Pool");
  console.log("-".repeat(80));
  
  const linkTx = await issuer.setLendingPool(await lendingPool.getAddress());
  await linkTx.wait();
  console.log("✅ Lending pool linked\n");

  // ============================================================================
  // TEST 4: Add Grove Token as Collateral
  // ============================================================================
  console.log("TEST 4: Add Grove Token as Collateral");
  console.log("-".repeat(80));
  
  const addCollateralTx = await lendingPool.addCollateralToken(groveTokenAddress);
  await addCollateralTx.wait();
  console.log("✅ Token added as collateral");
  
  const supportedTokens = await lendingPool.getSupportedCollateral();
  console.log(`   Supported tokens: ${supportedTokens.length}\n`);

  // ============================================================================
  // TEST 5: Provide Liquidity
  // ============================================================================
  console.log("TEST 5: Provide Liquidity to Pool");
  console.log("-".repeat(80));
  
  const liquidityAmount = ethers.parseUnits("10000", 6);
  
  await usdc.mint(investor.address, liquidityAmount);
  console.log(`✅ Minted ${ethers.formatUnits(liquidityAmount, 6)} USDC to investor`);
  
  await usdc.connect(investor).approve(await lendingPool.getAddress(), liquidityAmount);
  await lendingPool.connect(investor).provideLiquidity(liquidityAmount);
  console.log("✅ Liquidity provided");
  
  const lpToken = await ethers.getContractAt("LPToken", lpTokenAddress);
  const lpBalance = await lpToken.balanceOf(investor.address);
  console.log(`   LP tokens: ${ethers.formatUnits(lpBalance, 6)}\n`);

  // ============================================================================
  // TEST 6: Purchase Grove Tokens
  // ============================================================================
  console.log("TEST 6: Purchase Grove Tokens (for borrower)");
  console.log("-".repeat(80));
  
  const purchaseAmount = 100; // Buy 100 tokens (simple number, not wei)
  const purchaseCost = ethers.parseUnits("100", 6); // Cost 100 USDC
  
  await usdc.mint(borrower.address, purchaseCost);
  await usdc.connect(borrower).approve(await issuer.getAddress(), purchaseCost);
  await issuer.connect(borrower).purchaseTreeTokens(groveName, purchaseAmount);
  console.log(`✅ Purchased ${purchaseAmount} tokens`);
  
  const borrowerTokenBalance = await token.balanceOf(borrower.address);
  console.log(`   Balance: ${borrowerTokenBalance} tokens\n`);

  // ============================================================================
  // TEST 7: Take Loan
  // ============================================================================
  console.log("TEST 7: Take Loan with Grove Tokens");
  console.log("-".repeat(80));
  
  // Check token price and calculate values
  const tokenPrice = await oracle.getPrice(groveTokenAddress);
  console.log(`   Token price: ${ethers.formatUnits(tokenPrice, 6)} USDC per token`);
  
  const collateralAmount = 60; // 60 tokens
  const collateralValue = await lendingPool.getCollateralValue(groveTokenAddress, collateralAmount);
  console.log(`   Collateral: ${collateralAmount} tokens`);
  console.log(`   Collateral value: ${ethers.formatUnits(collateralValue, 6)} USDC`);
  
  const maxLoan = await lendingPool.getMaxLoanAmount(groveTokenAddress, collateralAmount);
  console.log(`   Max loan: ${ethers.formatUnits(maxLoan, 6)} USDC`);
  
  // Borrow 48 USDC with 60 tokens as collateral
  const loanAmount = ethers.parseUnits("48", 6); // 48 USDC
  console.log(`   Requesting loan: ${ethers.formatUnits(loanAmount, 6)} USDC`);
  
  await token.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
  console.log("✅ Collateral approved");
  
  await lendingPool.connect(borrower).takeLoan(groveTokenAddress, collateralAmount, loanAmount);
  console.log(`✅ Loan taken: ${ethers.formatUnits(loanAmount, 6)} USDC`);
  
  const loan = await lendingPool.getLoan(borrower.address);
  console.log(`   Collateral: ${loan[2]} tokens`);
  console.log(`   Repay amount: ${ethers.formatUnits(loan[3], 6)} USDC`);
  console.log(`   Active: ${loan[5]}\n`);

  // ============================================================================
  // TEST 8: Check Pool Stats
  // ============================================================================
  console.log("TEST 8: Pool Statistics");
  console.log("-".repeat(80));
  
  const stats = await lendingPool.getPoolStats();
  console.log(`   Total Liquidity: ${ethers.formatUnits(stats[0], 6)} USDC`);
  console.log(`   Available: ${ethers.formatUnits(stats[1], 6)} USDC`);
  console.log(`   Borrowed: ${ethers.formatUnits(stats[2], 6)} USDC`);
  console.log(`   Utilization: ${Number(stats[3]) / 100}%`);
  console.log(`   APY: ${Number(stats[4]) / 100}%\n`);

  // ============================================================================
  // TEST 9: Repay Loan
  // ============================================================================
  console.log("TEST 9: Repay Loan");
  console.log("-".repeat(80));
  
  const repayAmount = loan[3];
  
  await usdc.mint(borrower.address, repayAmount);
  await usdc.connect(borrower).approve(await lendingPool.getAddress(), repayAmount);
  await lendingPool.connect(borrower).repayLoan();
  console.log(`✅ Loan repaid: ${ethers.formatUnits(repayAmount, 6)} USDC`);
  
  const finalTokenBalance = await token.balanceOf(borrower.address);
  console.log(`   Collateral returned: ${finalTokenBalance} tokens\n`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("=".repeat(80));
  console.log("\n✅ ALL TESTS PASSED!\n");

  const finalStats = await lendingPool.getPoolStats();
  console.log("📊 Final Pool Statistics:");
  console.log(`   Total Liquidity: ${ethers.formatUnits(finalStats[0], 6)} USDC`);
  console.log(`   Available: ${ethers.formatUnits(finalStats[1], 6)} USDC`);
  console.log(`   Borrowed: ${ethers.formatUnits(finalStats[2], 6)} USDC`);
  console.log(`   Utilization: ${Number(finalStats[3]) / 100}%\n`);

  console.log("🎉 Lending Pool Integration: FULLY WORKING ✅\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test Failed:");
    console.error(error);
    process.exit(1);
  });
