Here's a comprehensive step-by-step migration plan from Hedera to Mantle:

Complete Migration Plan: Hedera → Mantle
Phase 1: Environment Setup (Day 1)
Step 1.1: Install Mantle Development Tools
# Install Hardhat for contract deployment
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers

# Initialize Hardhat
npx hardhat init
Step 1.2: Update Dependencies
# Remove Hedera dependencies
pnpm remove @hashgraph/sdk @hashgraph/hedera-wallet-connect

# Add/verify EVM dependencies
pnpm add ethers@^6.13.5 @openzeppelin/contracts@^5.2.0
Step 1.3: Configure Mantle Network
Create hardhat.config.ts:

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mantleTestnet: {
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 5003
    },
    mantleMainnet: {
      url: "https://rpc.mantle.xyz",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 5000
    }
  },
  etherscan: {
    apiKey: {
      mantleTestnet: process.env.MANTLE_API_KEY || ""
    }
  }
};

export default config;
Step 1.4: Update Environment Variables
Update .env:

# Mantle Configuration
MANTLE_RPC_URL=https://rpc.testnet.mantle.xyz
MANTLE_CHAIN_ID=5003
PRIVATE_KEY=your_private_key_here
MANTLE_EXPLORER=https://explorer.testnet.mantle.xyz
MANTLE_API_KEY=your_api_key

# USDC on Mantle (you'll need to deploy or use existing)
USDC_ADDRESS=0x...

# Remove old Hedera config
# HEDERA_NETWORK=testnet
# HEDERA_ACCOUNT_ID=...
Phase 2: Smart Contract Migration (Days 2-4)
Step 2.1: Create Standard ERC-20 Token Contract
Create contracts/tokens/CoffeeTreeToken.sol:

// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoffeeTreeToken is ERC20, Ownable {
    string public groveName;
    string public location;
    string public coffeeVariety;
    uint64 public expectedYieldPerSeason;
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _groveName,
        string memory _location,
        string memory _coffeeVariety,
        uint64 _expectedYield
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        groveName = _groveName;
        location = _location;
        coffeeVariety = _coffeeVariety;
        expectedYieldPerSeason = _expectedYield;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
Step 2.2: Migrate CoffeeTreeIssuer
Create contracts/CoffeeTreeIssuerMantle.sol:

// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./tokens/CoffeeTreeToken.sol";
import "./CoffeeRevenueReserve.sol";
import "./FarmerVerification.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoffeeTreeIssuerMantle {
    // Remove all Hedera-specific imports and logic
    // Replace HTS calls with standard ERC-20 operations
    
    address public admin;
    address public USDC;
    FarmerVerification public farmerVerification;
    
    mapping(string => CoffeeGrove) public coffeeGroves;
    mapping(string => address) public groveTokens;
    mapping(address => CoffeeRevenueReserve) public groveReserves;
    
    struct CoffeeGrove {
        string groveName;
        address farmer;
        string location;
        uint64 treeCount;
        string coffeeVariety;
        uint64 expectedYieldPerTree;
        bool isTokenized;
        address tokenAddress;
        uint64 totalTokens;
        uint256 registrationDate;
    }
    
    // Events remain similar
    event CoffeeGroveRegistered(...);
    event CoffeeGroveTokenized(...);
    
    constructor(address _farmerVerification, address _usdc) {
        admin = msg.sender;
        farmerVerification = FarmerVerification(_farmerVerification);
        USDC = _usdc;
    }
    
    function tokenizeCoffeeGrove(
        string memory _groveName,
        uint64 _tokensPerTree
    ) external {
        CoffeeGrove storage grove = coffeeGroves[_groveName];
        require(grove.farmer == msg.sender, "Not grove owner");
        require(!grove.isTokenized, "Already tokenized");
        
        // Deploy new ERC-20 token
        string memory tokenName = string(abi.encodePacked("Coffee Grove: ", _groveName));
        string memory tokenSymbol = string(abi.encodePacked("TREE-", _groveName));
        
        CoffeeTreeToken token = new CoffeeTreeToken(
            tokenName,
            tokenSymbol,
            _groveName,
            grove.location,
            grove.coffeeVariety,
            grove.expectedYieldPerTree
        );
        
        uint64 totalTokens = grove.treeCount * _tokensPerTree;
        token.mint(address(this), totalTokens);
        
        // Create revenue reserve
        CoffeeRevenueReserve reserve = new CoffeeRevenueReserve(
            address(token),
            msg.sender,
            USDC
        );
        
        grove.isTokenized = true;
        grove.tokenAddress = address(token);
        grove.totalTokens = totalTokens;
        groveTokens[_groveName] = address(token);
        groveReserves[address(token)] = reserve;
        
        emit CoffeeGroveTokenized(...);
    }
    
    function purchaseTreeTokens(
        string memory _groveName,
        uint64 _amount
    ) external {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        require(grove.isTokenized, "Grove not tokenized");
        
        // Calculate price (you'll need a price oracle)
        uint256 totalCost = _amount * getPricePerToken(grove.tokenAddress);
        
        // Transfer USDC from buyer to reserve
        IERC20(USDC).transferFrom(msg.sender, address(groveReserves[grove.tokenAddress]), totalCost);
        
        // Transfer tokens to buyer
        IERC20(grove.tokenAddress).transfer(msg.sender, _amount);
        
        emit TreeTokensPurchased(...);
    }
}
Step 2.3: Migrate CoffeeLendingPool
Create contracts/CoffeeLendingPoolMantle.sol:

// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoffeeLendingPoolMantle {
    // Remove all HTS-specific code
    // Replace with standard ERC-20 operations
    
    address public admin;
    address public USDC;
    address public coffeeTreeToken;
    address public lpToken;
    
    // Same structs as before
    struct Loan { ... }
    struct LiquidityPosition { ... }
    
    function provideLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Standard ERC-20 transfer
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        
        // Mint LP tokens
        uint256 lpTokensToMint = calculateLPTokens(amount);
        LPToken(lpToken).mint(msg.sender, lpTokensToMint);
        
        // Update state
        totalLiquidity += amount;
        availableLiquidity += amount;
        
        emit LiquidityProvided(msg.sender, amount, lpTokensToMint, block.timestamp);
    }
    
    function takeLoan(uint256 collateralAmount, uint256 loanAmount) external {
        // Standard ERC-20 operations
        IERC20(coffeeTreeToken).transferFrom(msg.sender, address(this), collateralAmount);
        IERC20(USDC).transfer(msg.sender, loanAmount);
        
        // Create loan record
        loans[msg.sender] = Loan({...});
        
        emit LoanTaken(...);
    }
}
Step 2.4: Create LP Token Contract
Create contracts/tokens/LPToken.sol:

// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
        Ownable(msg.sender) {}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
Phase 3: Deployment Scripts (Day 5)
Step 3.1: Create Deployment Script
Create scripts/deploy.ts:

import { ethers } from "hardhat";

async function main() {
  console.log("Deploying to Mantle...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // 1. Deploy USDC (or use existing)
  const USDC = await ethers.deployContract("MockUSDC");
  await USDC.waitForDeployment();
  console.log("USDC deployed to:", await USDC.getAddress());
  
  // 2. Deploy FarmerVerification
  const FarmerVerification = await ethers.deployContract("FarmerVerification");
  await FarmerVerification.waitForDeployment();
  console.log("FarmerVerification deployed to:", await FarmerVerification.getAddress());
  
  // 3. Deploy CoffeeTreeIssuer
  const Issuer = await ethers.deployContract("CoffeeTreeIssuerMantle", [
    await FarmerVerification.getAddress(),
    await USDC.getAddress()
  ]);
  await Issuer.waitForDeployment();
  console.log("Issuer deployed to:", await Issuer.getAddress());
  
  // 4. Deploy PriceOracle
  const Oracle = await ethers.deployContract("PriceOracle");
  await Oracle.waitForDeployment();
  console.log("Oracle deployed to:", await Oracle.getAddress());
  
  // 5. Deploy Marketplace
  const Marketplace = await ethers.deployContract("CoffeeTreeMarketplace", [
    await Issuer.getAddress(),
    await USDC.getAddress()
  ]);
  await Marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await Marketplace.getAddress());
  
  // 6. Deploy LendingPool
  const LendingPool = await ethers.deployContract("CoffeeLendingPoolMantle", [
    await USDC.getAddress(),
    ethers.ZeroAddress // Will be set per grove
  ]);
  await LendingPool.waitForDeployment();
  console.log("LendingPool deployed to:", await LendingPool.getAddress());
  
  // Save addresses
  const addresses = {
    USDC: await USDC.getAddress(),
    FarmerVerification: await FarmerVerification.getAddress(),
    Issuer: await Issuer.getAddress(),
    Oracle: await Oracle.getAddress(),
    Marketplace: await Marketplace.getAddress(),
    LendingPool: await LendingPool.getAddress()
  };
  
  console.log("\n=== Deployment Complete ===");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
Step 3.2: Deploy to Mantle Testnet
npx hardhat run scripts/deploy.ts --network mantleTestnet
Phase 4: Frontend Migration (Days 6-7)
Step 4.1: Update Wallet Integration
Replace frontend/wallet/connector.js:

import { ethers } from 'ethers';

export class WalletConnector {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }
  
  async connect() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    this.signer = await this.provider.getSigner();
    this.address = await this.signer.getAddress();
    
    // Switch to Mantle network
    await this.switchToMantle();
    
    return this.address;
  }
  
  async switchToMantle() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x138B' }], // 5003 in hex
      });
    } catch (error) {
      // Chain not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x138B',
            chainName: 'Mantle Testnet',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18
            },
            rpcUrls: ['https://rpc.testnet.mantle.xyz'],
            blockExplorerUrls: ['https://explorer.testnet.mantle.xyz']
          }]
        });
      }
    }
  }
  
  async getContract(address, abi) {
    return new ethers.Contract(address, abi, this.signer);
  }
}
Step 4.2: Update Contract Interactions
Replace frontend/js/contract-interactions.js:

import { ethers } from 'ethers';
import { WalletConnector } from '../wallet/connector.js';

const ISSUER_ADDRESS = 'YOUR_DEPLOYED_ADDRESS';
const ISSUER_ABI = [...]; // Import from artifacts

export async function purchaseTokens(groveName, amount) {
  const wallet = new WalletConnector();
  await wallet.connect();
  
  const issuer = await wallet.getContract(ISSUER_ADDRESS, ISSUER_ABI);
  
  // Approve USDC first
  const usdc = await wallet.getContract(USDC_ADDRESS, ERC20_ABI);
  const price = await issuer.getPricePerToken(groveName);
  const totalCost = price * BigInt(amount);
  
  const approveTx = await usdc.approve(ISSUER_ADDRESS, totalCost);
  await approveTx.wait();
  
  // Purchase tokens
  const purchaseTx = await issuer.purchaseTreeTokens(groveName, amount);
  await purchaseTx.wait();
  
  return purchaseTx.hash;
}
Phase 5: Backend Migration (Days 8-9)
Step 5.1: Update API Server
Update api/server.ts:

import { ethers } from 'ethers';

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Load contracts
const issuer = new ethers.Contract(
  process.env.ISSUER_ADDRESS!,
  ISSUER_ABI,
  wallet
);

// API endpoints remain similar, but use ethers instead of Hedera SDK
app.post('/api/groves/register', async (req, res) => {
  const { groveName, location, treeCount, variety, expectedYield } = req.body;
  
  try {
    const tx = await issuer.registerCoffeeGrove(
      groveName,
      location,
      treeCount,
      variety,
      expectedYield
    );
    
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      transactionHash: receipt.hash,
      explorerUrl: `${process.env.MANTLE_EXPLORER}/tx/${receipt.hash}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
Step 5.2: Update Event Indexing
Replace events/issuer.indexer.ts:

import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
const issuer = new ethers.Contract(ISSUER_ADDRESS, ISSUER_ABI, provider);

// Listen to events
issuer.on('CoffeeGroveRegistered', async (groveName, farmer, treeCount, event) => {
  console.log('Grove registered:', groveName);
  
  // Save to database
  await db.insert(coffeeGroves).values({
    groveName,
    farmer,
    treeCount,
    transactionHash: event.log.transactionHash,
    blockNumber: event.log.blockNumber
  });
});

// Or query past events
const filter = issuer.filters.CoffeeGroveRegistered();
const events = await issuer.queryFilter(filter, -10000); // Last 10k blocks
Phase 6: Testing (Days 10-11)
Step 6.1: Write Unit Tests
Create test/CoffeeTreeIssuer.test.ts:

import { expect } from "chai";
import { ethers } from "hardhat";

describe("CoffeeTreeIssuer", function () {
  it("Should register a coffee grove", async function () {
    const [owner, farmer] = await ethers.getSigners();
    
    const Issuer = await ethers.deployContract("CoffeeTreeIssuerMantle", [
      ethers.ZeroAddress,
      ethers.ZeroAddress
    ]);
    
    await Issuer.registerCoffeeGrove(
      "Test Grove",
      "Kenya",
      100,
      "Arabica",
      50
    );
    
    const grove = await Issuer.coffeeGroves("Test Grove");
    expect(grove.groveName).to.equal("Test Grove");
  });
});
Step 6.2: Run Tests
npx hardhat test
Phase 7: Deployment & Migration (Days 12-13)
Step 7.1: Deploy to Mantle Testnet
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network mantleTestnet

# Verify contracts
npx hardhat verify --network mantleTestnet DEPLOYED_ADDRESS "constructor" "args"
Step 7.2: Migrate Data (if needed)
Create scripts/migrate-data.ts:

// If you have existing data on Hedera, migrate it
// This depends on your specific data structure
Step 7.3: Update Frontend Config
Update frontend/js/config.js:

export const config = {
  network: 'mantle-testnet',
  chainId: 5003,
  rpcUrl: 'https://rpc.testnet.mantle.xyz',
  explorerUrl: 'https://explorer.testnet.mantle.xyz',
  contracts: {
    issuer: 'YOUR_ISSUER_ADDRESS',
    marketplace: 'YOUR_MARKETPLACE_ADDRESS',
    lendingPool: 'YOUR_LENDING_POOL_ADDRESS',
    usdc: 'YOUR_USDC_ADDRESS'
  }
};
Phase 8: Final Testing & Launch (Day 14)
Step 8.1: End-to-End Testing
Test wallet connection
Test grove registration
Test token purchase
Test lending/borrowing
Test marketplace
Step 8.2: Update Documentation
Update README.md with Mantle-specific instructions

Step 8.3: Deploy to Production
npx hardhat run scripts/deploy.ts --network mantleMainnet
Summary Checklist
[ ] Phase 1: Environment setup (Hardhat, dependencies, config)
[ ] Phase 2: Migrate all smart contracts (remove HTS, use ERC-20)
[ ] Phase 3: Create deployment scripts
[ ] Phase 4: Update frontend (wallet integration, contract calls)
[ ] Phase 5: Update backend (API, event indexing)
[ ] Phase 6: Write and run tests
[ ] Phase 7: Deploy to testnet and verify
[ ] Phase 8: Final testing and production deployment