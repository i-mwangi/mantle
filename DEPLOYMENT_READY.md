# 🚀 Deployment Ready - Chai Platform on Mantle

## ✅ Cleanup Complete!

### Files Moved to `deprecated/` folder:
```
deprecated/
├── hedera-contracts/
│   ├── CoffeeLendingPool.sol
│   ├── CoffeePriceOracle.sol
│   ├── CoffeeRevenueReserve.sol
│   ├── CoffeeTreeIssuer.sol
│   ├── CoffeeTreeManager.sol
│   ├── CoffeeTreeMarketplace.sol
│   ├── FarmerVerification.sol
│   ├── USDC.sol
│   ├── interfaces/
│   └── @openzeppelin/
└── hedera-system-contracts/
    └── system-contracts/
```

### Active Mantle Contracts:
```
contracts/mantle/
├── tokens/
│   ├── CoffeeTreeToken.sol          ✅
│   ├── LPToken.sol                  ✅
│   └── MockUSDC.sol                 ✅
├── CoffeeTreeIssuerSimple.sol       ✅
├── CoffeeRevenueReserve.sol         ✅
├── CoffeeLendingPool.sol            ✅
├── FarmerVerification.sol           ✅
└── PriceOracle.sol                  ✅
```

---

## 🎯 Pre-Deployment Checklist

### 1. Get a Wallet with Testnet MNT

**Option A: Use Existing MetaMask Wallet**
1. Open MetaMask
2. Click on your account icon → Settings → Security & Privacy
3. Click "Reveal Secret Recovery Phrase" or "Show Private Key"
4. Copy your private key (starts with 0x)

**Option B: Create New Wallet for Testing**
```bash
# Generate a new wallet
npx hardhat run scripts/mantle/generate-wallet.cjs
```

### 2. Add Private Key to .env

Create or update `.env` file:
```env
# Your wallet private key (DO NOT COMMIT THIS!)
PRIVATE_KEY=0xyour_private_key_here

# Mantle Network (optional, has defaults)
MANTLE_RPC_URL=https://rpc.testnet.mantle.xyz
MANTLE_CHAIN_ID=5003
```

### 3. Get Testnet MNT

1. Visit: **https://faucet.testnet.mantle.xyz**
2. Connect your MetaMask wallet
3. Click "Request MNT"
4. Wait ~30 seconds
5. Check balance in MetaMask (switch to Mantle Testnet)

**Need to add Mantle Testnet to MetaMask?**
- Network Name: Mantle Testnet
- RPC URL: https://rpc.testnet.mantle.xyz
- Chain ID: 5003
- Currency Symbol: MNT
- Block Explorer: https://sepolia.mantlescan.xyz

### 4. Verify Setup

```bash
node scripts/mantle/check-setup.cjs
```

Expected output:
```
✅ PRIVATE_KEY found in .env
✅ MANTLE_RPC_URL configured
✅ Dependencies installed
✅ Contracts compiled
🎉 Setup complete! Ready to deploy.
```

---

## 🚀 Deployment Steps

### Step 1: Compile Contracts (if not done)

```bash
npx hardhat compile
```

Expected output:
```
Compiled 14 Solidity files successfully
```

### Step 2: Deploy to Mantle Testnet

```bash
npx hardhat run scripts/mantle/deploy.ts --network mantleTestnet
```

Expected output:
```
🚀 Starting Chai Platform deployment to Mantle...
📝 Deploying with account: 0x...
💰 Account balance: 1.0 MNT

1️⃣  Deploying MockUSDC...
✅ MockUSDC deployed to: 0x...

2️⃣  Deploying FarmerVerification...
✅ FarmerVerification deployed to: 0x...

3️⃣  Deploying PriceOracle...
✅ PriceOracle deployed to: 0x...

4️⃣  Deploying CoffeeTreeIssuer...
✅ CoffeeTreeIssuer deployed to: 0x...

5️⃣  Deploying CoffeeLendingPool...
✅ CoffeeLendingPool deployed to: 0x...

6️⃣  Creating LP Token...
✅ LP Token created at: 0x...

🎉 DEPLOYMENT COMPLETE!
```

### Step 3: Save Contract Addresses

The deployment script will output addresses. Add them to your `.env`:

```env
# Deployed Contract Addresses
USDC_ADDRESS=0x...
FARMER_VERIFICATION_ADDRESS=0x...
PRICE_ORACLE_ADDRESS=0x...
ISSUER_ADDRESS=0x...
LENDING_POOL_ADDRESS=0x...
LP_TOKEN_ADDRESS=0x...
```

### Step 4: Verify Contracts (Optional but Recommended)

```bash
# Verify each contract
npx hardhat verify --network mantleTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example for USDC (no constructor args)
npx hardhat verify --network mantleTestnet 0x... 

# Example for Issuer (3 constructor args)
npx hardhat verify --network mantleTestnet 0x... 0xFARMER_VERIFICATION 0xUSDC 0xORACLE
```

---

## 🧪 Test Deployment

### Quick Test Script

Create `scripts/mantle/test-deployment.cjs`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  // Get deployed contracts
  const farmerVerification = await ethers.getContractAt(
    "FarmerVerification",
    process.env.FARMER_VERIFICATION_ADDRESS
  );
  
  // Test: Register as farmer
  console.log("\n1. Registering as farmer...");
  const tx = await farmerVerification.registerFarmer(
    "Test Farmer",
    "Kenya",
    "test@example.com"
  );
  await tx.wait();
  console.log("✅ Farmer registered!");
  
  // Test: Check registration
  const profile = await farmerVerification.getFarmerProfile(signer.address);
  console.log("✅ Farmer profile:", profile.name);
  
  console.log("\n🎉 Deployment test successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run test:
```bash
node scripts/mantle/test-deployment.cjs
```

---

## 📊 Deployment Costs (Estimated)

| Contract | Gas Used | Cost (MNT) | Cost (USD) |
|----------|----------|------------|------------|
| MockUSDC | ~800K | ~0.001 | ~$0.001 |
| FarmerVerification | ~1.2M | ~0.002 | ~$0.002 |
| PriceOracle | ~1.0M | ~0.002 | ~$0.002 |
| CoffeeTreeIssuer | ~4.5M | ~0.007 | ~$0.007 |
| CoffeeLendingPool | ~3.8M | ~0.006 | ~$0.006 |
| LP Token Creation | ~500K | ~0.001 | ~$0.001 |
| **Total** | **~11.8M** | **~0.019 MNT** | **~$0.019** |

*Costs are approximate and depend on gas prices*

---

## 🔍 View on Explorer

After deployment, view your contracts on:

**Mantle Testnet Explorer:**
https://sepolia.mantlescan.xyz

Search for your contract addresses to see:
- Contract code
- Transactions
- Events
- Token transfers

---

## 🎯 Next Steps After Deployment

### 1. Update Frontend
```javascript
// frontend/js/config.js
export const config = {
  network: 'mantle-testnet',
  chainId: 5003,
  contracts: {
    issuer: '0xYOUR_ISSUER_ADDRESS',
    usdc: '0xYOUR_USDC_ADDRESS',
    // ... other addresses
  }
};
```

### 2. Update Backend
```typescript
// api/server.ts
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const issuer = new ethers.Contract(
  process.env.ISSUER_ADDRESS!,
  ISSUER_ABI,
  wallet
);
```

### 3. Test Full Flow
1. Register as farmer
2. Create a grove
3. Tokenize grove
4. Purchase tokens
5. Report harvest
6. Distribute revenue

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"
**Solution:** Get more testnet MNT from faucet

### "Contract size exceeds limit"
**Solution:** Already using CoffeeTreeIssuerSimple (optimized)

### "Nonce too high"
**Solution:** Reset MetaMask account (Settings → Advanced → Reset Account)

### "Network not found"
**Solution:** Check MANTLE_RPC_URL in .env

### "Private key invalid"
**Solution:** Ensure private key starts with 0x and is 64 characters (after 0x)

---

## 📞 Support Resources

- **Mantle Docs:** https://docs.mantle.xyz
- **Mantle Discord:** https://discord.gg/mantle
- **Hardhat Docs:** https://hardhat.org/docs
- **Explorer:** https://sepolia.mantlescan.xyz

---

## ✅ Deployment Checklist

- [ ] Private key added to .env
- [ ] Testnet MNT received (check MetaMask)
- [ ] Contracts compiled successfully
- [ ] Setup verified (run check-setup.cjs)
- [ ] Deployed to testnet
- [ ] Contract addresses saved to .env
- [ ] Contracts verified on explorer (optional)
- [ ] Test deployment successful
- [ ] Frontend updated with addresses
- [ ] Backend updated with addresses
- [ ] Full flow tested
- [ ] Ready for production!

---

## 🎉 You're Ready!

Everything is set up and ready to deploy. Just need to:

1. **Add your private key to .env**
2. **Get testnet MNT from faucet**
3. **Run deployment command**

```bash
npx hardhat run scripts/mantle/deploy.ts --network mantleTestnet
```

**Good luck! 🚀**
