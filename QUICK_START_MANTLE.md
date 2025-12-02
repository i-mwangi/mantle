# Quick Start: Chai Platform on Mantle

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MetaMask wallet installed
- Some testnet MNT (from faucet)

---

## Step 1: Install Dependencies

```bash
pnpm install
```

---

## Step 2: Configure Environment

Create `.env` file:

```env
# Mantle Network
MANTLE_RPC_URL=https://rpc.testnet.mantle.xyz
MANTLE_MAINNET_RPC_URL=https://rpc.mantle.xyz
MANTLE_CHAIN_ID=5003
MANTLE_API_KEY=your_api_key_here

# Your Wallet
PRIVATE_KEY=your_private_key_here

# Deployed Contracts (fill after deployment)
USDC_ADDRESS=
FARMER_VERIFICATION_ADDRESS=
PRICE_ORACLE_ADDRESS=
ISSUER_ADDRESS=
LENDING_POOL_ADDRESS=
LP_TOKEN_ADDRESS=
```

---

## Step 3: Get Testnet MNT

1. Visit: https://faucet.testnet.mantle.xyz
2. Connect your MetaMask wallet
3. Request testnet MNT
4. Wait ~30 seconds

---

## Step 4: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
✓ Compiled 14 Solidity files successfully
```

---

## Step 5: Run Tests (Optional)

```bash
npx hardhat test
```

---

## Step 6: Deploy to Testnet

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

... (more deployments)

🎉 DEPLOYMENT COMPLETE!
```

---

## Step 7: Update .env with Addresses

Copy the deployed addresses to your `.env` file:

```env
USDC_ADDRESS=0x...
FARMER_VERIFICATION_ADDRESS=0x...
PRICE_ORACLE_ADDRESS=0x...
ISSUER_ADDRESS=0x...
LENDING_POOL_ADDRESS=0x...
LP_TOKEN_ADDRESS=0x...
```

---

## Step 8: Verify Contracts (Optional)

```bash
npx hardhat verify --network mantleTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network mantleTestnet 0x123... 0xabc... 0xdef... 0x456...
```

---

## 🎯 Common Tasks

### Register as a Farmer

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  
  const farmerVerification = await ethers.getContractAt(
    "FarmerVerification",
    process.env.FARMER_VERIFICATION_ADDRESS
  );
  
  await farmerVerification.registerFarmer(
    "John Doe",
    "Kenya, Nairobi",
    "john@example.com"
  );
  
  console.log("Farmer registered!");
}

main();
```

### Register a Coffee Grove

```javascript
const issuer = await ethers.getContractAt(
  "CoffeeTreeIssuerSimple",
  process.env.ISSUER_ADDRESS
);

await issuer.registerCoffeeGrove(
  "Sunrise Grove",
  "Kenya, Nairobi",
  100,        // tree count
  "Arabica",  // variety
  50          // expected yield per tree
);

console.log("Grove registered!");
```

### Tokenize a Grove

```javascript
await issuer.tokenizeCoffeeGrove(
  "Sunrise Grove",
  10  // tokens per tree
);

console.log("Grove tokenized!");
```

### Purchase Tokens

```javascript
const usdc = await ethers.getContractAt("MockUSDC", process.env.USDC_ADDRESS);

// Approve USDC spending
await usdc.approve(process.env.ISSUER_ADDRESS, ethers.parseUnits("100", 6));

// Purchase tokens
await issuer.purchaseTreeTokens("Sunrise Grove", 100);

console.log("Tokens purchased!");
```

---

## 🔧 Troubleshooting

### Issue: "Insufficient funds"
**Solution:** Get more testnet MNT from faucet

### Issue: "Contract size too large"
**Solution:** Use `CoffeeTreeIssuerSimple.sol` instead of full version

### Issue: "Network not found"
**Solution:** Check your `.env` file has correct RPC URL

### Issue: "Transaction reverted"
**Solution:** Check you have enough USDC and token approvals

---

## 📚 Next Steps

1. **Frontend Integration**
   - See: `frontend/wallet/` for MetaMask integration
   - Update contract addresses in `frontend/js/config.js`

2. **Backend Integration**
   - See: `api/server.ts` for API endpoints
   - Update to use ethers.js instead of Hedera SDK

3. **Production Deployment**
   - Deploy to Mantle Mainnet
   - Use real USDC address
   - Update frontend to use mainnet

---

## 🌐 Useful Links

- **Mantle Testnet Explorer:** https://sepolia.mantlescan.xyz
- **Mantle Mainnet Explorer:** https://mantlescan.xyz
- **Mantle Faucet:** https://faucet.testnet.mantle.xyz
- **Mantle Docs:** https://docs.mantle.xyz
- **Hardhat Docs:** https://hardhat.org/docs

---

## 💬 Need Help?

- Check `HEDERA_TO_MANTLE_MIGRATION.md` for detailed comparison
- Check `MIGRATION_PROGRESS.md` for current status
- Review test files in `test/mantle/` for examples

---

## ✅ Checklist

- [ ] Dependencies installed
- [ ] .env configured
- [ ] Testnet MNT received
- [ ] Contracts compiled
- [ ] Tests passing
- [ ] Contracts deployed
- [ ] Addresses updated in .env
- [ ] Contracts verified (optional)
- [ ] Frontend updated
- [ ] Backend updated
- [ ] Ready for production!

**Happy building! 🚀**
