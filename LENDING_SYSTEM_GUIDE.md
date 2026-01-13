# Lending System - User Guide

## 🎯 Overview

The lending system allows:
- **Investors** to deposit USDC and earn interest (receive LP tokens)
- **Farmers** to borrow USDC using grove tokens as collateral

All transactions are visible in MetaMask!

---

## 🚀 Quick Start

### 1. Setup (Admin Only - One Time)

Add grove tokens as accepted collateral:

```bash
node scripts/mantle/add-collateral-tokens.cjs
```

This adds all tokenized groves as supported collateral for borrowing.

### 2. Test the System

Run the comprehensive test:

```bash
node scripts/mantle/test-lending-system.cjs
```

This will:
- ✅ Mint test USDC
- ✅ Deposit USDC → Receive LP tokens
- ✅ Borrow USDC → USDC increases in MetaMask
- ✅ Repay loan → USDC decreases, collateral returned
- ✅ Withdraw → LP tokens decrease, USDC increases

---

## 💰 For Investors (Liquidity Providers)

### Deposit USDC and Earn Interest

**What happens:**
1. You deposit USDC into the lending pool
2. You receive LP tokens (visible in MetaMask)
3. You earn interest from borrowers
4. You can withdraw anytime (if liquidity available)

**Steps:**

1. **Go to Investor Portal** → Lending section
2. **Enter amount** to deposit (e.g., 5000 USDC)
3. **Click "Deposit"**
4. **Approve USDC** in MetaMask
5. **Confirm deposit** transaction
6. **See LP tokens** appear in MetaMask!

**Add LP Token to MetaMask:**
- Token Address: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5`
- Symbol: `CLP-LP`
- Decimals: `18`

### Withdraw Your Funds

**What happens:**
1. You burn LP tokens
2. You receive USDC back (principal + interest)
3. LP tokens decrease in MetaMask
4. USDC increases in MetaMask

**Steps:**

1. **Go to Investor Portal** → Lending section
2. **Enter LP token amount** to withdraw
3. **Click "Withdraw"**
4. **Confirm transaction** in MetaMask
5. **See USDC** increase in MetaMask!

---

## 🏦 For Farmers (Borrowers)

### Borrow USDC Using Grove Tokens

**What happens:**
1. You lock grove tokens as collateral
2. You receive USDC (visible in MetaMask)
3. You pay 10% interest
4. You must maintain 125% collateralization

**Requirements:**
- Own grove tokens (from tokenized groves)
- Collateral value must be 125% of loan amount
- Example: To borrow $1,000 USDC, need $1,250 worth of grove tokens

**Steps:**

1. **Go to Farmer Dashboard** → Lending section
2. **Select grove token** as collateral
3. **Enter collateral amount** (e.g., 100 tokens)
4. **System calculates max loan** you can take
5. **Enter loan amount** (e.g., 1000 USDC)
6. **Click "Borrow"**
7. **Approve grove tokens** in MetaMask
8. **Confirm borrow** transaction
9. **See USDC** increase in MetaMask!

### Repay Your Loan

**What happens:**
1. You pay back USDC (loan + 10% interest)
2. Your grove tokens are returned
3. USDC decreases in MetaMask
4. Grove tokens returned to wallet

**Steps:**

1. **Go to Farmer Dashboard** → Active Loans
2. **Click "Repay Loan"**
3. **Approve USDC** for repayment
4. **Confirm repay** transaction
5. **See collateral** returned in MetaMask!

---

## 📊 Key Numbers

### Interest Rates
- **Borrowers pay**: 10% APR (fixed)
- **Lenders earn**: 8.5% APY (base rate)
- **Platform fee**: 3% of interest

### Collateral Requirements
- **Collateralization Ratio**: 125%
  - To borrow $1,000 → Need $1,250 collateral
- **Liquidation Threshold**: 90%
  - If collateral value drops below $900 → Liquidation

### Example Calculation

**Scenario**: Borrow 1,000 USDC

```
Collateral needed: 1,000 × 1.25 = 1,250 USDC worth of grove tokens
Interest (10%): 1,000 × 0.10 = 100 USDC
Total to repay: 1,000 + 100 = 1,100 USDC
```

---

## 🔍 Checking Balances in MetaMask

### USDC Token
- **Address**: `0xe96c82aBA229efCC7a46e46D194412C691feD1D5`
- **Symbol**: `USDC`
- **Decimals**: `6`

### LP Token (Liquidity Provider)
- **Address**: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5`
- **Symbol**: `CLP-LP`
- **Decimals**: `18`

### Grove Tokens
Each tokenized grove has its own token address. Check the Investor Portal to see grove token addresses.

---

## 🎬 Transaction Flow

### Deposit Flow
```
1. User clicks "Deposit 5000 USDC"
2. MetaMask: Approve USDC spending
3. MetaMask: Confirm deposit transaction
4. ✅ LP tokens appear in MetaMask
5. ✅ USDC balance decreases
```

### Borrow Flow
```
1. User clicks "Borrow 1000 USDC"
2. MetaMask: Approve grove token spending
3. MetaMask: Confirm borrow transaction
4. ✅ USDC balance increases
5. ✅ Grove tokens locked (not visible until repaid)
```

### Repay Flow
```
1. User clicks "Repay Loan"
2. MetaMask: Approve USDC spending
3. MetaMask: Confirm repay transaction
4. ✅ USDC balance decreases
5. ✅ Grove tokens returned to wallet
```

### Withdraw Flow
```
1. User clicks "Withdraw 2500 LP tokens"
2. MetaMask: Confirm withdraw transaction
3. ✅ LP tokens decrease
4. ✅ USDC balance increases (principal + interest)
```

---

## 🛡️ Safety Features

### For Lenders
- ✅ Over-collateralized loans (125%)
- ✅ Automatic liquidation if collateral drops
- ✅ Diversified across multiple borrowers
- ✅ Can withdraw anytime (if liquidity available)

### For Borrowers
- ✅ Fixed 10% interest rate
- ✅ No credit check required
- ✅ Flexible repayment (repay anytime)
- ✅ Collateral returned immediately after repayment

---

## 📱 API Endpoints

### Get Lending Pools
```bash
GET /api/lending/pools
```

Returns pool statistics (liquidity, APY, utilization).

### Get Loan Details
```bash
GET /api/lending/loans/:address
```

Returns active loan for an address.

### Get Liquidity Positions
```bash
GET /api/lending/liquidity-positions/:address
```

Returns LP positions and earnings.

### Deposit
```bash
POST /api/lending/deposit
Body: { userAddress, amount }
```

### Withdraw
```bash
POST /api/lending/withdraw
Body: { userAddress, amount }
```

### Borrow
```bash
POST /api/lending/borrow
Body: { borrowerAddress, collateralTokenAddress, collateralAmount, borrowAmount }
```

### Repay
```bash
POST /api/lending/repay
Body: { borrowerAddress }
```

---

## 🐛 Troubleshooting

### "Insufficient LP token balance"
- You don't have enough LP tokens to withdraw
- Check your LP token balance in MetaMask

### "Insufficient collateral"
- Your collateral value is less than 125% of loan amount
- Increase collateral or decrease loan amount

### "Collateral token not supported"
- The grove token hasn't been added as collateral
- Admin needs to run: `node scripts/mantle/add-collateral-tokens.cjs`

### "No active loan found"
- You don't have an active loan to repay
- Check if you already repaid it

### "Insufficient USDC balance"
- You don't have enough USDC to repay
- Get more USDC first

---

## 🎓 Example Scenarios

### Scenario 1: Investor Earns Interest

**Alice deposits 10,000 USDC:**
1. Receives 10,000 LP tokens
2. Pool lends to farmers at 10% APR
3. Alice earns 8.5% APY
4. After 1 year: Withdraws 10,850 USDC

**Profit: 850 USDC**

### Scenario 2: Farmer Gets Working Capital

**Bob needs 5,000 USDC for harvest:**
1. Has 500 grove tokens worth $12.50 each = $6,250
2. Borrows 5,000 USDC (125% collateralized)
3. Uses USDC for harvest operations
4. Sells harvest, earns 8,000 USDC
5. Repays 5,500 USDC (5,000 + 10% interest)
6. Gets 500 grove tokens back

**Profit: 2,500 USDC (8,000 - 5,500)**

### Scenario 3: Liquidation (Safety Mechanism)

**Charlie borrows 1,000 USDC:**
1. Provides 100 grove tokens worth $12.50 = $1,250
2. Grove token price drops to $9.00
3. Collateral now worth $900 (90% of loan)
4. System automatically liquidates
5. Collateral sold to repay lenders
6. Charlie loses collateral but lenders protected

---

## ✅ Success Checklist

Before going live, verify:

- [ ] Lending pool deployed
- [ ] LP token deployed
- [ ] Grove tokens added as collateral
- [ ] Test deposit/withdraw works
- [ ] Test borrow/repay works
- [ ] LP tokens visible in MetaMask
- [ ] USDC changes visible in MetaMask
- [ ] Frontend displays real data
- [ ] API endpoints return correct data

---

## 🚀 Next Steps

1. **Run the test script** to verify everything works
2. **Add collateral tokens** for all groves
3. **Test with real users** on Mantle Sepolia
4. **Monitor pool health** and utilization
5. **Adjust interest rates** based on demand

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review transaction in Mantle Explorer
3. Check backend logs for errors
4. Verify contract addresses in `.env`

**Mantle Sepolia Explorer**: https://explorer.sepolia.mantle.xyz/

---

## 🎉 You're Ready!

The lending system is now fully functional. Users can:
- ✅ Deposit USDC and see LP tokens in MetaMask
- ✅ Borrow USDC and see balance increase
- ✅ Repay loans and see USDC decrease
- ✅ Withdraw and see LP tokens decrease, USDC increase

All transactions are transparent and visible in MetaMask! 🚀
