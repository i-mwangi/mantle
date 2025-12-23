/**
 * Demo: Tokenize a Coffee Grove and Take a Loan
 * Complete workflow demonstration
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🌳 Coffee Grove Tokenization & Lending Demo\n");
  console.log("=".repeat(80));

  // Get signers
  const [deployer, farmer, investor, borrower] = await ethers.getSigners();
  
  console.log("\n👥 Participants:");
  console.log(`   Admin/Deployer: ${deployer.address}`);
  console.log(`   Farmer: ${farmer.address}`);
  console.log(`   Liquidity Provider: ${investor.address}`);
  console.log(`   Borrower: ${borrower.address}`);
  console.log("");

  // ============================================================================
  // DEPLOY CONTRACTS
  // ============================================================================
  console.log("📦 Deploying Contracts...");
  console.log("-".repeat(80));

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log(`   ✅ USDC: ${await usdc.getAddress()}`);

  const FarmerVerification = await ethers.getContractFactory("FarmerVerification");
  const farmerVerification = await FarmerVerification.deploy();
  await farmerVerification.waitForDeployment();
  console.log(`   ✅ Farmer Verification: ${await farmerVerification.getAddress()}`);

  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  console.log(`   ✅ Price Oracle: ${await oracle.getAddress()}`);

  const CoffeeTreeIssuerSimple = await ethers.getContractFactory("CoffeeTreeIssuerSimple");
  const issuer = await CoffeeTreeIssuerSimple.deploy(
    await farmerVerification.getAddress(),
    await usdc.getAddress(),
    await oracle.getAddress()
  );
  await issuer.waitForDeployment();
  console.log(`   ✅ Issuer: ${await issuer.getAddress()}`);

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
  // STEP 1: Setup - Verify Farmer
  // ============================================================================
  console.log("STEP 1: Farmer Registration & Verification");
  console.log("-".repeat(80));
  
  // Farmer registers
  console.log("   Farmer registering...");
  const registerTx = await farmerVerification.connect(farmer).registerFarmer(
    "Maria Kamau",
    "Nyeri County, Kenya",
    "maria@kenyacoffee.co.ke"
  );
  await registerTx.wait();
  console.log("   ✅ Farmer registered");

  // Admin verifies
  console.log("   Admin verifying farmer...");
  const verifyTx = await farmerVerification.verifyFarmer(
    farmer.address,
    "ipfs://QmVerificationDoc123"
  );
  await verifyTx.wait();
  console.log("   ✅ Farmer verified by admin");
  console.log("");

  // ============================================================================
  // STEP 2: Register Coffee Grove
  // ============================================================================
  console.log("STEP 2: Register Coffee Grove");
  console.log("-".repeat(80));
  
  const groveName = "Kirinyaga Premium Estate";
  const location = "Kirinyaga County, Mount Kenya Region";
  const treeCount = 250; // 250 coffee trees
  const variety = "Arabica SL28 & Ruiru 11";
  const expectedYield = 45; // 45kg per tree per season
  
  console.log(`   Grove: ${groveName}`);
  console.log(`   Location: ${location}`);
  console.log(`   Trees: ${treeCount}`);
  console.log(`   Variety: ${variety}`);
  console.log(`   Expected Yield: ${expectedYield}kg/tree/season`);
  console.log("");
  
  console.log("   Registering grove...");
  const registerGroveTx = await issuer.connect(farmer).registerCoffeeGrove(
    groveName,
    location,
    treeCount,
    variety,
    expectedYield
  );
  await registerGroveTx.wait();
  console.log("   ✅ Grove registered");
  console.log("");

  // ============================================================================
  // STEP 3: Tokenize Coffee Grove
  // ============================================================================
  console.log("STEP 3: Tokenize Coffee Grove");
  console.log("-".repeat(80));
  
  const tokensPerTree = 10; // 10 tokens per tree
  const totalTokens = treeCount * tokensPerTree; // 2,500 tokens
  
  console.log(`   Tokens per tree: ${tokensPerTree}`);
  console.log(`   Total tokens: ${totalTokens}`);
  console.log("");
  
  let groveTokenAddress;
  
  const grove = await issuer.getGroveInfo(groveName);
  
  console.log("   Tokenizing grove...");
  const tokenizeTx = await issuer.connect(farmer).tokenizeCoffeeGrove(
    groveName,
    tokensPerTree
  );
  await tokenizeTx.wait();
  console.log("   ✅ Grove tokenized");
  
  groveTokenAddress = await issuer.getGroveTokenAddress(groveName);
  console.log(`   Token Address: ${groveTokenAddress}`);
  
  // Set token price
  console.log("   Setting token price...");
  await oracle.setTokenPrice(groveTokenAddress, ethers.parseUnits("1.5", 6)); // 1.5 USDC per token
  console.log("   ✅ Token price set to 1.5 USDC");
  
  const token = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
  const supply = await token.totalSupply();
  console.log(`   Total Supply: ${supply} tokens`);
  console.log("");

  // ============================================================================
  // STEP 4: Setup Lending Pool
  // ============================================================================
  console.log("STEP 4: Setup Lending Pool");
  console.log("-".repeat(80));
  
  // Link issuer to lending pool
  console.log("   Linking lending pool to issuer...");
  await issuer.setLendingPool(await lendingPool.getAddress());
  console.log("   ✅ Lending pool linked");
  
  // Add grove token as collateral
  console.log("   Adding token as collateral...");
  await lendingPool.addCollateralToken(groveTokenAddress);
  console.log("   ✅ Token added as collateral");
  
  // Provide liquidity
  console.log("   Providing liquidity to pool...");
  const liquidityAmount = ethers.parseUnits("50000", 6); // 50,000 USDC
  await usdc.mint(investor.address, liquidityAmount);
  await usdc.connect(investor).approve(await lendingPool.getAddress(), liquidityAmount);
  await lendingPool.connect(investor).provideLiquidity(liquidityAmount);
  console.log(`   ✅ Provided ${ethers.formatUnits(liquidityAmount, 6)} USDC liquidity`);
  console.log("");

  // ============================================================================
  // STEP 5: Borrower Acquires Grove Tokens
  // ============================================================================
  console.log("STEP 5: Borrower Acquires Grove Tokens");
  console.log("-".repeat(80));
  
  const tokensToBuy = 200; // Buy 200 tokens
  
  const groveTokenForPurchase = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
  
  console.log(`   Purchasing ${tokensToBuy} grove tokens...`);
  const purchaseTokenPrice = await oracle.getPrice(groveTokenAddress);
  const cost = (BigInt(tokensToBuy) * purchaseTokenPrice);
  
  await usdc.mint(borrower.address, cost);
  await usdc.connect(borrower).approve(await issuer.getAddress(), cost);
  await issuer.connect(borrower).purchaseTreeTokens(groveName, tokensToBuy);
  console.log(`   ✅ Purchased ${tokensToBuy} tokens for ${ethers.formatUnits(cost, 6)} USDC`);
  
  const finalBalance = await groveTokenForPurchase.balanceOf(borrower.address);
  console.log(`   Borrower token balance: ${finalBalance} tokens`);
  console.log("");

  // ============================================================================
  // STEP 6: Calculate Loan Parameters
  // ============================================================================
  console.log("STEP 6: Calculate Loan Parameters");
  console.log("-".repeat(80));
  
  const collateralTokens = 200; // Use 200 tokens as collateral
  const tokenPrice = await oracle.getPrice(groveTokenAddress);
  const collateralValue = await lendingPool.getCollateralValue(groveTokenAddress, collateralTokens);
  const maxLoan = await lendingPool.getMaxLoanAmount(groveTokenAddress, collateralTokens);
  
  console.log(`   Collateral: ${collateralTokens} tokens`);
  console.log(`   Token Price: ${ethers.formatUnits(tokenPrice, 6)} USDC per token`);
  console.log(`   Collateral Value: ${ethers.formatUnits(collateralValue, 6)} USDC`);
  console.log(`   Max Loan (80%): ${ethers.formatUnits(maxLoan, 6)} USDC`);
  console.log(`   Collateralization: 125%`);
  console.log(`   Interest Rate: 10%`);
  console.log("");

  // ============================================================================
  // STEP 7: Take Loan
  // ============================================================================
  console.log("STEP 7: Take Loan Using Grove Tokens as Collateral");
  console.log("-".repeat(80));
  
  // Borrow 90% of max to be safe
  const loanAmount = (maxLoan * 90n) / 100n;
  
  const groveToken = await ethers.getContractAt("L2CoffeeTreeToken", groveTokenAddress);
  
  console.log(`   Requesting loan: ${ethers.formatUnits(loanAmount, 6)} USDC`);
  console.log(`   Collateral: ${collateralTokens} tokens`);
  console.log("");
  
  // Approve collateral
  console.log("   Approving collateral...");
  await groveToken.connect(borrower).approve(await lendingPool.getAddress(), collateralTokens);
  console.log("   ✅ Collateral approved");
  
  // Take loan
  console.log("   Taking loan...");
  const borrowerUSDCBefore = await usdc.balanceOf(borrower.address);
  
  const loanTx = await lendingPool.connect(borrower).takeLoan(
    groveTokenAddress,
    collateralTokens,
    loanAmount
  );
  await loanTx.wait();
  
  const borrowerUSDCAfter = await usdc.balanceOf(borrower.address);
  console.log("   ✅ Loan taken successfully!");
  console.log("");
  
  // Get loan details
  const loan = await lendingPool.getLoan(borrower.address);
  console.log("   📊 Loan Details:");
  console.log(`      Loan Amount: ${ethers.formatUnits(loan[1], 6)} USDC`);
  console.log(`      Collateral: ${loan[2]} tokens`);
  console.log(`      Repay Amount: ${ethers.formatUnits(loan[3], 6)} USDC (includes 10% interest)`);
  console.log(`      Borrow Date: ${new Date(Number(loan[4]) * 1000).toLocaleString()}`);
  console.log(`      Active: ${loan[5]}`);
  console.log("");
  console.log(`   💰 Borrower USDC Balance: ${ethers.formatUnits(borrowerUSDCAfter, 6)} USDC`);
  console.log("");

  // ============================================================================
  // STEP 8: Pool Statistics
  // ============================================================================
  console.log("STEP 8: Lending Pool Statistics");
  console.log("-".repeat(80));
  
  const stats = await lendingPool.getPoolStats();
  console.log(`   Total Liquidity: ${ethers.formatUnits(stats[0], 6)} USDC`);
  console.log(`   Available: ${ethers.formatUnits(stats[1], 6)} USDC`);
  console.log(`   Total Borrowed: ${ethers.formatUnits(stats[2], 6)} USDC`);
  console.log(`   Utilization Rate: ${Number(stats[3]) / 100}%`);
  console.log(`   Base APY: ${Number(stats[4]) / 100}%`);
  console.log("");

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("=".repeat(80));
  console.log("\n✅ DEMO COMPLETED SUCCESSFULLY!\n");
  
  console.log("📝 Summary:");
  console.log(`   Grove: ${groveName}`);
  console.log(`   Location: ${location}`);
  console.log(`   Total Trees: ${treeCount}`);
  console.log(`   Total Tokens: ${totalTokens}`);
  console.log(`   Token Price: ${ethers.formatUnits(tokenPrice, 6)} USDC`);
  console.log(`   Loan Taken: ${ethers.formatUnits(loanAmount, 6)} USDC`);
  console.log(`   Collateral: ${collateralTokens} tokens (${ethers.formatUnits(collateralValue, 6)} USDC value)`);
  console.log("");
  console.log("🎉 The borrower now has USDC liquidity while keeping exposure to their coffee grove tokens!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Demo Failed:");
    console.error(error);
    process.exit(1);
  });
