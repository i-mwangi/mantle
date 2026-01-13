# 🚀 Quick Start - Lending System

## ⚠️ IMPORTANT: Address Setup

The test deposits were made from address `0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9` (from PRIVATE_KEY in .env).

**To see your LP tokens in the frontend:**
1. Import this private key to MetaMask: `0xb888fc593e5475be06e04efbac2debd1184272d7ed6f86cba99553ed1ff055d3`
2. Add LP token: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5` (Symbol: CLP-LP, Decimals: 6)
3. Connect with this address in the frontend

**OR** make new deposits from your current MetaMask address.

See `QUICK_FIX.md` for detailed instructions.

---

## ✅ What's Been Done

I've fully implemented the lending system with complete blockchain integration. Here's what works:

### 1. **Backend Service** ✅
- `lib/api/mantle-lending-service.ts` - Complete implementation
- `lib/api/contract-abis.ts` - Updated with correct ABIs
- `api/mantle-api-router.ts` - Real data endpoints
- Database foreign key issue fixed

### 2. **MetaMask Integration** ✅
- Deposit USDC → See LP tokens appear
- Borrow USDC → See USDC increase
- Repay loan → See USDC decrease, collateral returned
- Withdraw → See LP tokens decrease, USDC increase

### 3. **Test Scripts** ✅
- `scripts/mantle/add-collateral-tokens.cjs` - Add grove tokens as collateral
- `scripts/mantle/test-lending-system.cjs` - End-to-end test
- `scripts/mantle/compare-addresses.cjs` - Check LP balances
- `scripts/mantle/fix-usdc-asset.cjs` - Fix database

---

## 🎯 How to Use (3 Steps)

### Step 1: Add Collateral Tokens (One Time)
```bash
node scripts/mantle/add-collateral-tokens.cjs
```

This adds all tokenized grove tokens as accepted collateral for borrowing.

### Step 2: Test the System
```bash
node scripts/mantle/test-lending-system.cjs
```

This will:
- Mint test USDC
- Deposit 5,000 USDC → Receive LP tokens
- Borrow 1,000 USDC → USDC increases in MetaMask
- Repay loan → USDC decreases, collateral returned
- Withdraw → LP tokens decrease, USDC increases

### Step 3: Use in Frontend
```bash
# Start API server
pnpm run api

# Open frontend
# http://localhost:3000/app.html
# Go to Lending section
```

---

## 💡 Key Features

### For Investors:
1. Deposit USDC → Get LP tokens (visible in MetaMask)
2. Earn 8.5% APY from borrowers
3. Withdraw anytime (if liquidity available)

### For Farmers:
1. Borrow USDC using grove tokens as collateral
2. Pay 10% interest
3. Need 125% collateralization
4. Repay anytime to get collateral back

---

## 📊 Contract Addresses

```
USDC: 0xe96c82aBA229efCC7a46e46D194412C691feD1D5
Lending Pool: 0x529e03fC9d0971601e5f5FB1Ae01192AC1EB913F
LP Token: 0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5
```

**Add LP Token to MetaMask:**
- Address: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5`
- Symbol: `CLP-LP`
- Decimals: `18`

---

## ✅ What Works

- ✅ Deposit USDC → LP tokens appear in MetaMask
- ✅ Borrow USDC → USDC increases in MetaMask
- ✅ Repay loan → USDC decreases, collateral returned
- ✅ Withdraw → LP tokens decrease, USDC increases
- ✅ Real blockchain transactions
- ✅ Database tracking
- ✅ API endpoints return real data
- ✅ Frontend displays real data

---

## 📚 Documentation

- `LENDING_SYSTEM_ANALYSIS.md` - Detailed analysis
- `LENDING_SYSTEM_GUIDE.md` - User guide
- `LENDING_IMPLEMENTATION_COMPLETE.md` - Complete summary

---

## 🎉 You're Ready!

Run the test script and watch the magic:

```bash
node scripts/mantle/test-lending-system.cjs
```

Then check MetaMask to see your LP tokens and USDC balance changes! 🚀
