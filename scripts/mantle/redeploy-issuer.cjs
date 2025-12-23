/**
 * Redeploy Coffee Tree Issuer with Correct Parameters
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Redeploying Coffee Tree Issuer with Correct Parameters\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT\n");

  // Correct addresses
  const usdcAddress = "0xe96c82aBA229efCC7a46e46D194412C691feD1D5";
  const farmerVerificationAddress = "0xBeBd1F23dB2C0D6636bc311A44030123906129A5";
  const priceOracleAddress = "0xD9842968C7c80242d7BeC5dA986DC4f66d20D5a8";

  console.log("📦 Using Deployed Contracts:");
  console.log("   USDC:", usdcAddress);
  console.log("   Farmer Verification:", farmerVerificationAddress);
  console.log("   Price Oracle:", priceOracleAddress);
  console.log("");

  console.log("⚠️  Previous Issuer (WRONG PARAMS): 0xCD23767bF40C0b4909EE35C8b9147D28c61567d4");
  console.log("");

  // Deploy Coffee Tree Issuer with CORRECT parameter order
  console.log("🌳 Deploying Coffee Tree Issuer (Simple) with CORRECT parameters...");
  console.log("   Constructor params: (farmerVerification, usdc, oracle)");
  console.log("");
  
  const CoffeeTreeIssuerSimple = await ethers.getContractFactory("CoffeeTreeIssuerSimple");
  const issuer = await CoffeeTreeIssuerSimple.deploy(
    farmerVerificationAddress,  // ✅ CORRECT: First param is farmerVerification
    usdcAddress,                 // ✅ CORRECT: Second param is usdc
    priceOracleAddress          // ✅ CORRECT: Third param is oracle
  );
  
  console.log("⏳ Waiting for deployment...");
  await issuer.waitForDeployment();
  const issuerAddress = await issuer.getAddress();
  console.log("✅ Coffee Tree Issuer deployed:", issuerAddress);
  console.log("");

  // Verify the configuration
  console.log("🔍 Verifying Configuration...");
  const admin = await issuer.admin();
  const usdc = await issuer.USDC();
  const oracle = await issuer.oracle();
  const farmerVerification = await issuer.farmerVerification();
  
  console.log("   Admin:", admin);
  console.log("   USDC:", usdc);
  console.log("   Oracle:", oracle);
  console.log("   Farmer Verification:", farmerVerification);
  console.log("");

  const usdcMatch = usdc.toLowerCase() === usdcAddress.toLowerCase();
  const farmerMatch = farmerVerification.toLowerCase() === farmerVerificationAddress.toLowerCase();
  const oracleMatch = oracle.toLowerCase() === priceOracleAddress.toLowerCase();

  if (usdcMatch && farmerMatch && oracleMatch) {
    console.log("✅ All addresses match! Deployment successful!");
  } else {
    console.log("❌ Address mismatch detected:");
    console.log("   USDC Match:", usdcMatch);
    console.log("   Farmer Verification Match:", farmerMatch);
    console.log("   Oracle Match:", oracleMatch);
  }
  console.log("");

  console.log("=".repeat(70));
  console.log("\n✅ Deployment Complete!\n");

  console.log("📝 Update your .env file:");
  console.log(`MANTLE_ISSUER_ADDRESS=${issuerAddress}`);
  console.log("");

  console.log("🔍 Verify contract on Mantle Explorer:");
  console.log(`npx hardhat verify --network mantleSepolia ${issuerAddress} "${farmerVerificationAddress}" "${usdcAddress}" "${priceOracleAddress}"`);
  console.log("");

  console.log("🎯 Next Steps:");
  console.log("   1. Update MANTLE_ISSUER_ADDRESS in .env");
  console.log("   2. Run: node test-grove-tokenization.js");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
