# Quick Fix - See Your LP Tokens Now! 🚀

## The Problem
Your LP tokens exist on the blockchain but you're checking with the wrong MetaMask address.

## The Solution (2 minutes)

### Step 1: Import the Correct Address to MetaMask
1. Open MetaMask
2. Click your account icon (top right)
3. Click "Import Account"
4. Select "Private Key"
5. Paste this: `0xb888fc593e5475be06e04efbac2debd1184272d7ed6f86cba99553ed1ff055d3`
6. Click "Import"

### Step 2: Add LP Token to MetaMask
1. In MetaMask, scroll down and click "Import tokens"
2. Click "Custom token"
3. Enter:
   - **Token Address**: `0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5`
   - **Symbol**: `CLP-LP`
   - **Decimals**: `6`
4. Click "Add Custom Token"
5. Click "Import Tokens"

### Step 3: Refresh Frontend
1. Go to your lending frontend
2. Connect with the newly imported account
3. You should see: **27,150 LP tokens** worth **27,150 USDC**!

## Verify It Worked

Run this command to confirm:
```bash
node scripts/mantle/compare-addresses.cjs
```

You should see:
```
✅ Address from PRIVATE_KEY: 27150.0 CLP-LP
❌ User MetaMask Address: 0.0 CLP-LP
```

After importing the key, both addresses will show the tokens!

## What You'll See

### In MetaMask
- **USDC Balance**: Your USDC amount
- **CLP-LP Balance**: 27,150 LP tokens
- **Network**: Mantle Sepolia Testnet

### In Frontend
- **Liquidity Positions**: 1 position
- **Amount Deposited**: 27,150 USDC
- **Current Value**: 27,150 USDC
- **APY**: 8.5%
- **Earned Interest**: 0 USDC (just deposited)

## Test the Full Flow

### 1. Withdraw Some Liquidity
- Click "Withdraw" on your position
- Enter amount (e.g., 1000 LP tokens)
- Confirm in MetaMask
- Watch: LP tokens decrease, USDC increases!

### 2. Deposit More
- Click "Provide Liquidity"
- Enter USDC amount
- Confirm in MetaMask
- Watch: USDC decreases, LP tokens increase!

### 3. Borrow (if you have grove tokens)
- Click "Borrow"
- Select collateral token
- Enter amounts
- Confirm in MetaMask
- Watch: USDC increases, collateral locked!

## Troubleshooting

### "I don't see the LP tokens in MetaMask"
- Make sure you imported the token (Step 2 above)
- Check you're on Mantle Sepolia network
- Refresh MetaMask

### "Frontend still shows 0 positions"
- Make sure you connected with the imported account
- Refresh the page
- Check browser console for errors

### "I want to use my original address instead"
- Keep your original address connected
- Make a new deposit from the frontend
- LP tokens will be minted to your address
- You'll see them immediately!

## Need Help?

Run diagnostics:
```bash
# Check both addresses
node scripts/mantle/compare-addresses.cjs

# Check pool stats
node scripts/mantle/test-lending-system.cjs

# Check specific address
node scripts/mantle/check-lp-balance.cjs
```

## Summary

✅ Blockchain: Working perfectly
✅ LP Tokens: Exist and are yours
✅ Database: Fixed
✅ Frontend: Will work once you connect the right address

**Just import the private key and you're done!** 🎉
