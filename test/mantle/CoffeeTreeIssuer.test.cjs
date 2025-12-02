const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoffeeTreeIssuer - Mantle Migration", function () {
  let issuer, farmerVerification, usdc, oracle;
  let owner, farmer, investor;

  beforeEach(async function () {
    [owner, farmer, investor] = await ethers.getSigners();

    // Deploy contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const FarmerVerification = await ethers.getContractFactory("FarmerVerification");
    farmerVerification = await FarmerVerification.deploy();
    await farmerVerification.waitForDeployment();

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();

    const CoffeeTreeIssuer = await ethers.getContractFactory("CoffeeTreeIssuer");
    issuer = await CoffeeTreeIssuer.deploy(
      await farmerVerification.getAddress(),
      await usdc.getAddress(),
      await oracle.getAddress()
    );
    await issuer.waitForDeployment();

    // Setup: Register and verify farmer
    await farmerVerification.connect(farmer).registerFarmer(
      "John Doe",
      "Kenya",
      "john@example.com"
    );
    await farmerVerification.verifyFarmer(farmer.address, "ipfs://doc-hash");
  });

  describe("Grove Registration", function () {
    it("Should register a coffee grove", async function () {
      await issuer.connect(farmer).registerCoffeeGrove(
        "Sunrise Grove",
        "Kenya, Nairobi",
        100,
        "Arabica",
        50
      );

      const grove = await issuer.getGroveInfo("Sunrise Grove");
      expect(grove.groveName).to.equal("Sunrise Grove");
      expect(grove.farmer).to.equal(farmer.address);
      expect(grove.treeCount).to.equal(100);
      expect(grove.isTokenized).to.equal(false);
    });

    it("Should fail if farmer not verified", async function () {
      await expect(
        issuer.connect(investor).registerCoffeeGrove(
          "Test Grove",
          "Location",
          100,
          "Arabica",
          50
        )
      ).to.be.revertedWithCustomError(issuer, "UnverifiedFarmer");
    });
  });

  describe("Grove Tokenization", function () {
    beforeEach(async function () {
      await issuer.connect(farmer).registerCoffeeGrove(
        "Sunrise Grove",
        "Kenya, Nairobi",
        100,
        "Arabica",
        50
      );
    });

    it("Should tokenize a grove and create ERC-20 token", async function () {
      await issuer.connect(farmer).tokenizeCoffeeGrove("Sunrise Grove", 10);

      const grove = await issuer.getGroveInfo("Sunrise Grove");
      expect(grove.isTokenized).to.equal(true);
      expect(grove.totalTokens).to.equal(1000); // 100 trees * 10 tokens
      expect(grove.tokenAddress).to.not.equal(ethers.ZeroAddress);

      // Verify token was created
      const tokenAddress = grove.tokenAddress;
      const token = await ethers.getContractAt("CoffeeTreeToken", tokenAddress);
      
      const tokenName = await token.name();
      expect(tokenName).to.include("Sunrise Grove");
      
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(1000);
    });

    it("Should set token price in oracle", async function () {
      await issuer.connect(farmer).tokenizeCoffeeGrove("Sunrise Grove", 10);
      
      const grove = await issuer.getGroveInfo("Sunrise Grove");
      const price = await oracle.getPrice(grove.tokenAddress);
      
      expect(price).to.equal(1_000000); // $1.00 in 6 decimals
    });
  });

  describe("Token Purchase", function () {
    beforeEach(async function () {
      await issuer.connect(farmer).registerCoffeeGrove(
        "Sunrise Grove",
        "Kenya, Nairobi",
        100,
        "Arabica",
        50
      );
      await issuer.connect(farmer).tokenizeCoffeeGrove("Sunrise Grove", 10);
      
      // Give investor some USDC
      await usdc.mint(investor.address, 10000_000000n); // 10,000 USDC
    });

    it("Should purchase tokens with USDC", async function () {
      const grove = await issuer.getGroveInfo("Sunrise Grove");
      const token = await ethers.getContractAt("CoffeeTreeToken", grove.tokenAddress);
      
      // Approve USDC spending
      await usdc.connect(investor).approve(await issuer.getAddress(), 100_000000n);
      
      // Purchase 100 tokens
      await issuer.connect(investor).purchaseTreeTokens("Sunrise Grove", 100);
      
      // Check investor received tokens
      const balance = await token.balanceOf(investor.address);
      expect(balance).to.equal(100);
    });

    it("Should transfer USDC to reserve", async function () {
      const grove = await issuer.getGroveInfo("Sunrise Grove");
      const reserveAddress = await issuer.groveReserves(grove.tokenAddress);
      
      await usdc.connect(investor).approve(await issuer.getAddress(), 100_000000n);
      await issuer.connect(investor).purchaseTreeTokens("Sunrise Grove", 100);
      
      const reserveBalance = await usdc.balanceOf(reserveAddress);
      expect(reserveBalance).to.equal(100_000000n); // 100 tokens * $1
    });
  });

  describe("Harvest Reporting", function () {
    beforeEach(async function () {
      await issuer.connect(farmer).registerCoffeeGrove(
        "Sunrise Grove",
        "Kenya, Nairobi",
        100,
        "Arabica",
        50
      );
      await issuer.connect(farmer).tokenizeCoffeeGrove("Sunrise Grove", 10);
    });

    it("Should report harvest", async function () {
      await issuer.connect(farmer).reportHarvest(
        "Sunrise Grove",
        1000, // 1000 kg
        85,   // 85% quality
        5_000000 // $5 per kg
      );

      const harvests = await issuer.getGroveHarvests("Sunrise Grove");
      expect(harvests.length).to.equal(1);
      expect(harvests[0].yieldKg).to.equal(1000);
      expect(harvests[0].totalRevenue).to.equal(5000_000000n); // 1000 * $5
      expect(harvests[0].revenueDistributed).to.equal(false);
    });
  });

  describe("View Functions", function () {
    it("Should get all groves", async function () {
      await issuer.connect(farmer).registerCoffeeGrove("Grove 1", "Kenya", 100, "Arabica", 50);
      await issuer.connect(farmer).registerCoffeeGrove("Grove 2", "Ethiopia", 150, "Robusta", 60);

      const groves = await issuer.getAllGroves();
      expect(groves.length).to.equal(2);
      expect(groves[0]).to.equal("Grove 1");
      expect(groves[1]).to.equal("Grove 2");
    });

    it("Should get grove count", async function () {
      await issuer.connect(farmer).registerCoffeeGrove("Grove 1", "Kenya", 100, "Arabica", 50);
      
      const count = await issuer.getGroveCount();
      expect(count).to.equal(1);
    });
  });
});
