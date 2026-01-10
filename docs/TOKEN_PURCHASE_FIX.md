# Token Purchase Fix - January 10, 2026

## Problem
The token purchase endpoint was failing with error: `issuerContract.sellTokens is not a function`

## Root Cause
The API was calling a non-existent `sellTokens()` function on the issuer contract. The actual smart contract (`CoffeeTreeIssuerSimple.sol`) has a `purchaseTreeTokens()` function instead, which works differently:

- **What we were trying**: Backend calls `sellTokens(tokenAddress, buyer, amount)` to transfer tokens
- **What exists**: Investor calls `purchaseTreeTokens(groveName, amount)` directly, which requires USDC approval first

## Current Solution (MVP)
Implemented a mock transaction approach that:
1. Generates a fake transaction hash for testing
2. Updates the database `tokensSold` counter
3. Records terms acceptance
4. Returns success to the frontend

This allows testing the full investor flow without blockchain integration.

## Files Changed
- `api/mantle-api-router.ts` - Replaced blockchain transaction with mock implementation
- `lib/api/contract-abis.ts` - Added `purchaseTreeTokens` function to ISSUER_ABI

## Testing
1. Start API server: `pnpm run api`
2. Open investor portal in browser
3. Click "Invest Now" on any tokenized grove
4. Purchase tokens - should succeed and update available tokens count

## Future: Full Blockchain Integration

To implement proper blockchain integration, you have two options:

### Option 1: Use Existing Contract (Recommended)
Modify the frontend to call `purchaseTreeTokens()` directly from the investor's wallet:

```javascript
// In investor-portal.js, after user confirms purchase:
const issuerContract = new ethers.Contract(issuerAddress, ISSUER_ABI, signer);
const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);

// 1. Calculate total cost
const pricePerToken = await oracle.getPrice(tokenAddress);
const totalCost = pricePerToken * tokenAmount;

// 2. Approve USDC spending
const approveTx = await usdcContract.approve(issuerAddress, totalCost);
await approveTx.wait();

// 3. Purchase tokens
const purchaseTx = await issuerContract.purchaseTreeTokens(groveName, tokenAmount);
await purchaseTx.wait();

// 4. Call backend API to update database
await coffeeAPI.recordPurchase(groveId, tokenAmount, investorAddress, purchaseTx.hash);
```

### Option 2: Add Backend Function to Contract
Add a new `sellTokens()` function to the smart contract that allows the backend to transfer tokens:

```solidity
function sellTokens(address tokenAddress, address buyer, uint64 amount) external onlyAdmin {
    require(IERC20(tokenAddress).balanceOf(address(this)) >= amount, "Insufficient tokens");
    IERC20(tokenAddress).transfer(buyer, amount);
    emit TreeTokensPurchased(tokenAddress, amount, buyer, 0);
}
```

Then redeploy the contract and update the backend to use this function.

## Recommendation
**Option 1** is better because:
- No contract redeployment needed
- Investor pays gas fees (not the platform)
- More decentralized - investor controls the transaction
- Follows standard DeFi patterns

The backend should only record the purchase in the database after the blockchain transaction succeeds.
