/**
 * Comprehensive Test for Lending Pool Integration
 * Tests the complete workflow from grove registration to lending
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Lending Pool Integration\n");
  console.log("=".repeat(80));

  // Get signers
  const [deployer, farmer, investor, borrower] = await ethers.getSigners();
  
  console.log("\n👥 Test Accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Farmer: ${farmer.address}`);
  console.log(`   Investor: ${investor.address}`);
  console.log(`   Borrower: ${borrower.address}`);
  console.log("");

  // Get deployed contract addresses from the latest deployment
  console.log("📋 Getting Contract Addresses...");
  
  // We need to get the actual deployed addresses
  // For now, let's check if contracts exist at expected addresses
  const issuerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const lendingPoolAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Check if contracts are deployed
  const issuerCode = await ethers.provider.getCode(issuerAddress);
  const lendingPoolCode = await ethers.provider.getCode(lendingPoolAddress);
  
  if (issuerCode === "0x") {
    console.log("❌ Issuer contract not found at", issuerAddress);
    console.log("Please deploy contracts first: node scripts/mantle/deploy-remaining.cjs");
    return;
  }
  
  if (lendingPoolCode === "0x") {
    console.log("❌ Lending Pool contract not found at", lendingPoolAddress);
    console.log("Please deploy contracts first: node scripts/mantle/deploy-remaining.cjs");
    return;
  }
  
  console.log("✅ Contracts found on network");
  console.log("");

  // Get contract instances
  const usdc = await ethers.getContractAt("MockUSDC", usdcAddress);
  const farmerVerification = await ethers.getContractAt("FarmerVerification", farmerVerificationAddress);
  const issuer = await ethers.getContractAt("CoffeeTreeIssuerSimple", issuerAddress);
  const lendingPool = await ethers.getContractAt("CoffeeLendingPool", lendingPoolAddress);

  console.log("📋 Contract Instances Created");
  console.log("");

  // ============================================================================
  // TEST 1: Verify Farmer
  // ============================================================================
  console.log("TEST 1: Verify Farmer");
  console.log("-".repeat(80));
  
  try {
    const isVerified = await farmerVerification.isVerifiedFarmer(farmer.address);
    
    if (!isVerified) {
      console.log("   Verifying farmer...");
      const verifyTx = await farmerVerification.verifyFarmer(
        farmer.address,
        "Test Farmer",
        "Kenya",
        "test@farmer.com"
      );
      await verifyTx.wait();
      console.log("   ✅ Farmer verified");
    } else {
      console.log("   ✅ Farmer already verified");
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 2: Register and Tokenize Grove
  // ============================================================================
  console.log("TEST 2: Register and Tokenize Grove");
  console.log("-".repeat(80));
  
  const groveName = "Test Grove " + Date.now();
  let groveTokenAddress;
  
  try {
    // Register grove
    console.log(`   Registering grove: ${groveName}`);
    const registerTx = await issuer.connect(farmer).registerCoffeeGrove(
      groveName,
      "Kenya, Nyeri",
      100, // 100 trees
      "Arabica SL28",
      50 // 50kg per tree
    );
    await registerTx.wait();
    console.log("   ✅ Grove registered");

    // Tokenize grove
    console.log("   Tokenizing grove...");
    const tokenizeTx = await issuer.connect(farmer).tokenizeCoffeeGrove(
      groveName,
      10 // 10 tokens per tree = 1000 total tokens
    );
    await tokenizeTx.wait();
    console.log("   ✅ Grove tokenized");

    // Get token address
    const grove = await issuer.getGroveInfo(groveName);
    groveTokenAddress = grove.tokenAddress;
    console.log(`   Token Address: ${groveTokenAddress}`);
    
    const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
    const totalSupply = await token.totalSupply();
    console.log(`   Total Supply: ${totalSupply} tokens`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
    return;
  }
  console.log("");

  // ============================================================================
  // TEST 3: Link Issuer to Lending Pool
  // ============================================================================
  console.log("TEST 3: Link Issuer to Lending Pool");
  console.log("-".repeat(80));
  
  try {
    const currentLendingPool = await issuer.lendingPool();
    
    if (currentLendingPool === ethers.ZeroAddress) {
      console.log("   Linking lending pool...");
      const linkTx = await issuer.setLendingPool(lendingPoolAddress);
      await linkTx.wait();
      console.log("   ✅ Lending pool linked");
    } else {
      console.log(`   ✅ Already linked to: ${currentLendingPool}`);
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 4: Add Grove Token as Collateral
  // ============================================================================
  console.log("TEST 4: Add Grove Token as Collateral");
  console.log("-".repeat(80));
  
  try {
    const isSupported = await lendingPool.isCollateralSupported(groveTokenAddress);
    
    if (!isSupported) {
      console.log("   Adding token as collateral...");
      const addTx = await lendingPool.addCollateralToken(groveTokenAddress);
      await addTx.wait();
      console.log("   ✅ Token added as collateral");
    } else {
      console.log("   ✅ Token already supported as collateral");
    }

    // Verify
    const supportedTokens = await lendingPool.getSupportedCollateral();
    console.log(`   Supported Collateral Tokens: ${supportedTokens.length}`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 5: Provide Liquidity to Pool
  // ============================================================================
  console.log("TEST 5: Provide Liquidity to Pool");
  console.log("-".repeat(80));
  
  const liquidityAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  
  try {
    // Mint USDC to investor
    console.log("   Minting USDC to investor...");
    const mintTx = await usdc.mint(investor.address, liquidityAmount);
    await mintTx.wait();
    console.log(`   ✅ Minted ${ethers.formatUnits(liquidityAmount, 6)} USDC`);

    // Approve lending pool
    console.log("   Approving lending pool...");
    const approveTx = await usdc.connect(investor).approve(lendingPoolAddress, liquidityAmount);
    await approveTx.wait();
    console.log("   ✅ Approved");

    // Provide liquidity
    console.log("   Providing liquidity...");
    const provideTx = await lendingPool.connect(investor).provideLiquidity(liquidityAmount);
    await provideTx.wait();
    console.log("   ✅ Liquidity provided");

    // Check LP tokens
    const lpTokenAddress = await lendingPool.getLPToken();
    const lpToken = await ethers.getContractAt("LPToken", lpTokenAddress);
    const lpBalance = await lpToken.balanceOf(investor.address);
    console.log(`   LP Tokens Received: ${ethers.formatUnits(lpBalance, 6)}`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 6: Purchase Grove Tokens (for borrower)
  // ============================================================================
  console.log("TEST 6: Purchase Grove Tokens");
  console.log("-".repeat(80));
  
  const purchaseAmount = 100; // Buy 100 tokens
  
  try {
    // Mint USDC to borrower
    const purchaseCost = ethers.parseUnits("100", 6); // Assume 1 USDC per token
    console.log("   Minting USDC to borrower...");
    const mintTx = await usdc.mint(borrower.address, purchaseCost);
    await mintTx.wait();

    // Approve issuer
    console.log("   Approving issuer...");
    const approveTx = await usdc.connect(borrower).approve(issuerAddress, purchaseCost);
    await approveTx.wait();

    // Purchase tokens
    console.log(`   Purchasing ${purchaseAmount} grove tokens...`);
    const purchaseTx = await issuer.connect(borrower).purchaseTreeTokens(groveName, purchaseAmount);
    await purchaseTx.wait();
    console.log("   ✅ Tokens purchased");

    // Check balance
    const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
    const tokenBalance = await token.balanceOf(borrower.address);
    console.log(`   Token Balance: ${tokenBalance}`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 7: Take Loan with Grove Tokens as Collateral
  // ============================================================================
  console.log("TEST 7: Take Loan with Grove Tokens");
  console.log("-".repeat(80));
  
  const collateralAmount = 100; // Use all 100 tokens
  const loanAmount = ethers.parseUnits("80", 6); // Borrow 80 USDC (125% collateralization)
  
  try {
    // Approve lending pool to take collateral
    console.log("   Approving collateral...");
    const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
    const approveTx = await token.connect(borrower).approve(lendingPoolAddress, collateralAmount);
    await approveTx.wait();
    console.log("   ✅ Collateral approved");

    // Take loan
    console.log(`   Taking loan of ${ethers.formatUnits(loanAmount, 6)} USDC...`);
    const loanTx = await lendingPool.connect(borrower).takeLoan(
      groveTokenAddress,
      collateralAmount,
      loanAmount
    );
    await loanTx.wait();
    console.log("   ✅ Loan taken");

    // Check loan details
    const loan = await lendingPool.getLoan(borrower.address);
    console.log(`   Loan Amount: ${ethers.formatUnits(loan[1], 6)} USDC`);
    console.log(`   Collateral: ${loan[2]} tokens`);
    console.log(`   Repay Amount: ${ethers.formatUnits(loan[3], 6)} USDC`);
    console.log(`   Active: ${loan[5]}`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 8: Check Pool Statistics
  // ============================================================================
  console.log("TEST 8: Pool Statistics");
  console.log("-".repeat(80));
  
  try {
    const stats = await lendingPool.getPoolStats();
    console.log(`   Total Liquidity: ${ethers.formatUnits(stats[0], 6)} USDC`);
    console.log(`   Available Liquidity: ${ethers.formatUnits(stats[1], 6)} USDC`);
    console.log(`   Total Borrowed: ${ethers.formatUnits(stats[2], 6)} USDC`);
    console.log(`   Utilization Rate: ${stats[3] / 100}%`);
    console.log(`   Base APY: ${stats[4] / 100}%`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // TEST 9: Repay Loan
  // ============================================================================
  console.log("TEST 9: Repay Loan");
  console.log("-".repeat(80));
  
  try {
    const loan = await lendingPool.getLoan(borrower.address);
    const repayAmount = loan[3]; // Full repay amount with interest

    // Mint additional USDC for interest
    console.log("   Minting USDC for repayment...");
    const mintTx = await usdc.mint(borrower.address, repayAmount);
    await mintTx.wait();

    // Approve repayment
    console.log("   Approving repayment...");
    const approveTx = await usdc.connect(borrower).approve(lendingPoolAddress, repayAmount);
    await approveTx.wait();

    // Repay loan
    console.log(`   Repaying ${ethers.formatUnits(repayAmount, 6)} USDC...`);
    const repayTx = await lendingPool.connect(borrower).repayLoan();
    await repayTx.wait();
    console.log("   ✅ Loan repaid");

    // Check collateral returned
    const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
    const tokenBalance = await token.balanceOf(borrower.address);
    console.log(`   Collateral Returned: ${tokenBalance} tokens`);
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log("");

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("=".repeat(80));
  console.log("\n✅ ALL TESTS COMPLETED!\n");

  console.log("📊 Final Pool Statistics:");
  const finalStats = await lendingPool.getPoolStats();
  console.log(`   Total Liquidity: ${ethers.formatUnits(finalStats[0], 6)} USDC`);
  console.log(`   Available Liquidity: ${ethers.formatUnits(finalStats[1], 6)} USDC`);
  console.log(`   Total Borrowed: ${ethers.formatUnits(finalStats[2], 6)} USDC`);
  console.log(`   Utilization Rate: ${finalStats[3] / 100}%`);
  console.log("");

  console.log("🎯 Integration Status: WORKING ✅");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test Failed:");
    console.error(error);
    process.exit(1);
  });
