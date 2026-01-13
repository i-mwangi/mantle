# 🚀 Quick Start - Lending System

## ✅ FIXED: Now Multi-User!

The lending system now works for **unlimited users**. Each user signs their own transactions with MetaMask and gets their own LP tokens!

---

## 🎯 How to Use (Any User)

### Step 1: Connect MetaMask
1. Open the frontend
2. Connect your MetaMask wallet
3. Make sure you're on **Mantle Sepolia** network

### Step 2: Deposit USDC
1. Click "Provide Liquidity"
2. Enter amount (e.g., 1000 USDC)
3. **MetaMask will pop up** - Approve USDC
4. **MetaMask will pop up again** - Provide liquidity
5. **LP tokens minted to YOUR address!**

### Step 3: See Your LP Tokens
1. In MetaMask, click "Import tokens"
2. Enter:
   - **Address**: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5`
   - **Symbol**: `CLP-LP`
   - **Decimals**: `6`
3. You should see your LP tokens!

### Step 4: Withdraw Anytime
1. Click "Withdraw" on your position
2. Enter LP token amount
3. **MetaMask will pop up** - Confirm
4. **USDC sent to YOUR address!**

---

## 🔧 For Developers

### What Changed

**Before (Broken)**:
- Backend signed all transactions with one private key
- All LP tokens went to backend address
- Only one user could use the system

**After (Fixed)**:
- Users sign their own transactions with MetaMask
- LP tokens go to each user's address
- Unlimited users can participate!

### Files Changed
1. **`frontend/js/lending-web3.js`** - New Web3 service
2. **`frontend/js/api.js`** - Updated to use Web3
3. **`frontend/app.html`** - Added ethers.js
4. **`api/mantle-api-router.ts`** - Optional tracking

### Test Scripts

Add collateral tokens (one time):
```bash
node scripts/mantle/add-collateral-tokens.cjs
```

Check LP balance:
```bash
node scripts/mantle/check-lp-balance.cjs
```

Compare addresses:
```bash
node scripts/mantle/compare-addresses.cjs
```

---

## 📊 Multi-User Example

### User A
- Deposits 1,000 USDC
- Gets 1,000 LP tokens in their wallet
- Can withdraw anytime

### User B
- Deposits 5,000 USDC
- Gets 5,000 LP tokens in their wallet
- User A's position unchanged!

### User C
- Deposits 500 USDC
- Gets 500 LP tokens in their wallet
- Both A and B positions unchanged!

**Everyone has independent positions!**

---

## 🚀 Start API Server

```bash
pnpm run api
```

Then open the frontend and start using the lending system!

---

## 📚 Documentation

- **`MULTI_USER_LENDING_FIXED.md`** - Complete technical details
- **`LENDING_READY_FOR_PRODUCTION.md`** - Production checklist

---

## ⚠️ Important Notes

### Old Test Data
The 27,150 LP tokens at address `0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9` are from testing with the old system. They're still valid but were created before the multi-user fix.

### New Deposits
All new deposits work correctly - LP tokens go to the user who makes the deposit!

### MetaMask Required
Users must have MetaMask installed and connected to Mantle Sepolia network.

---

## ✅ What Works

- ✅ Deposit USDC → Receive LP tokens (in YOUR wallet)
- ✅ Withdraw LP tokens → Receive USDC (in YOUR wallet)
- ✅ Borrow USDC → Lock collateral (from YOUR wallet)
- ✅ Repay loan → Unlock collateral (to YOUR wallet)
- ✅ Multi-user support (unlimited users)
- ✅ Independent positions (each user separate)
- ✅ MetaMask integration (all transactions visible)

---

## 🎉 Summary

The lending system is now **production-ready for multiple users**! Each user:
- Signs their own transactions with MetaMask
- Gets LP tokens in their own wallet
- Has an independent position
- Can deposit/withdraw anytime

**No more "only one address has LP tokens" - now every user gets their own!** 🚀
