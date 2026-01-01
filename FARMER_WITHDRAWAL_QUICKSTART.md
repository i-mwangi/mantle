# Farmer Withdrawal System - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Deploy the Contract (2 min)

```bash
# Compile contracts
npx hardhat compile

# Deploy CoffeeRevenueReserve for your grove
node scripts/mantle/deploy-revenue-reserve.cjs <GROVE_TOKEN_ADDRESS> <FARMER_ADDRESS>

# Example:
node scripts/mantle/deploy-revenue-reserve.cjs 0xaf4da1406A8EE17AfEF5AeE644481a6b1cB01a9c 0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9
```

**Output:**
```
✅ CoffeeRevenueReserve deployed!
Contract Address: 0x...
📝 Add to .env:
MANTLE_REVENUE_RESERVE_ADDRESS=0x...
```

### Step 2: Update Environment (30 sec)

Add the contract address to `.env`:

```env
MANTLE_REVENUE_RESERVE_ADDRESS=0x...
```

### Step 3: Fund the Contract (1 min)

Transfer USDC to the contract address. The contract needs enough USDC to cover farmer withdrawals.

**Using MetaMask:**
1. Copy contract address
2. Send USDC to that address
3. Confirm transaction

### Step 4: Test Withdrawal (1 min)

**Via API:**
```bash
curl -X POST http://localhost:3001/api/farmer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "farmerAddress": "0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9",
    "groveId": 1,
    "amount": 187.20
  }'
```

**Via UI:**
1. Open `http://localhost:3000/farmer-dashboard.html`
2. Connect wallet
3. Go to "Revenue Tracking" section
4. Select grove from dropdown
5. Click "Withdraw Full Balance"
6. View transaction on Mantle Explorer

### Step 5: Verify (30 sec)

Check the transaction on Mantle Explorer:
```
https://explorer.sepolia.mantle.xyz/tx/0x...
```

✅ **Done!** Farmers can now withdraw their revenue.

---

## 📚 Full Documentation

- **Setup Guide:** [docs/FARMER_WITHDRAWAL_SETUP.md](docs/FARMER_WITHDRAWAL_SETUP.md)
- **Testing Guide:** [docs/WITHDRAWAL_TESTING_GUIDE.md](docs/WITHDRAWAL_TESTING_GUIDE.md)
- **Implementation Details:** [docs/WITHDRAWAL_IMPLEMENTATION_SUMMARY.md](docs/WITHDRAWAL_IMPLEMENTATION_SUMMARY.md)
- **MetaMask Setup for Farmers:** [docs/FARMER_METAMASK_SETUP.md](docs/FARMER_METAMASK_SETUP.md) ⭐

## 🆘 Troubleshooting

**Error: "MANTLE_REVENUE_RESERVE_ADDRESS not configured"**
→ Add contract address to `.env`

**Error: "Insufficient balance"**
→ Fund the contract with USDC

**Error: "Blockchain transaction failed"**
→ Check contract balance and farmer address

## 🔗 Useful Links

- [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz/)
- [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)
- [CoffeeRevenueReserve Contract](contracts/mantle/CoffeeRevenueReserve.sol)

## ✨ What's Implemented

✅ Full blockchain integration with ethers.js  
✅ Real transaction hashes and confirmations  
✅ Withdrawal history tracking  
✅ Error handling and recovery  
✅ UI integration (already working)  
✅ Database audit trail  
✅ Block explorer links  

## 🎯 Next Steps

1. Deploy for production (Mantle Mainnet)
2. Set up monitoring and alerts
3. Implement automated contract funding
4. Add batch withdrawal support
