# Farmer Withdrawal System - Implementation Summary

## Overview

Implemented full blockchain integration for the farmer withdrawal system, allowing farmers to withdraw their revenue share from distributed harvests via the `CoffeeRevenueReserve` smart contract on Mantle Sepolia.

## What Was Implemented

### 1. Backend API Integration (`api/mantle-api-router.ts`)

#### `handleFarmerWithdraw` Function
- **Before:** Mock implementation with fake transaction hashes
- **After:** Full blockchain integration with ethers.js

**Key Features:**
- Validates farmer address and withdrawal amount
- Checks available balance from distributed harvests
- Subtracts previous withdrawals
- Creates withdrawal record in database (status: 'pending')
- Connects to Mantle network via ethers.js
- Calls `withdrawFarmerShare()` on CoffeeRevenueReserve contract
- Waits for transaction confirmation
- Updates withdrawal record with real transaction hash
- Handles failures gracefully (status: 'failed' with error message)

**Code Changes:**
```typescript
// Import ethers and contract ABI
const { ethers } = await import('ethers');
const { REVENUE_RESERVE_ABI } = await import('../lib/api/contract-abis.js');

// Create provider and signer
const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);

// Create contract instance
const revenueReserveContract = new ethers.Contract(
  revenueReserveAddress,
  REVENUE_RESERVE_ABI,
  signer
);

// Convert amount to USDC units (6 decimals)
const amountInUSDC = ethers.parseUnits(amount.toString(), 6);

// Call contract function
const tx = await revenueReserveContract.withdrawFarmerShare(
  amountInUSDC,
  farmerAddress
);

// Wait for confirmation
const receipt = await tx.wait();
```

#### `handleGetFarmerWithdrawals` Function
- **Before:** Returned empty array with "coming soon" message
- **After:** Returns actual withdrawal history from database

**Features:**
- Fetches all withdrawals for a farmer
- Orders by request date
- Returns complete withdrawal details including transaction hashes

### 2. Database Schema

**Table:** `farmerWithdrawals` (already existed in schema)

**Fields Used:**
- `id` - Unique withdrawal identifier
- `farmerAddress` - Farmer's wallet address
- `groveId` - Grove ID (optional, null for all groves)
- `amount` - Withdrawal amount in dollars
- `status` - 'pending' | 'completed' | 'failed'
- `transactionHash` - Blockchain transaction hash
- `blockExplorerUrl` - Link to Mantle Explorer
- `errorMessage` - Error details if failed
- `requestedAt` - Request timestamp
- `completedAt` - Completion timestamp

### 3. Smart Contract ABI

**File:** `lib/api/contract-abis.ts`

**Added:** `REVENUE_RESERVE_ABI` (already existed)

```typescript
export const REVENUE_RESERVE_ABI = [
  'function withdrawFarmerShare(uint256 _amount, address _recipient)',
  'function getFarmerBalance(address _farmer) view returns (uint256)',
  'function farmer() view returns (address)',
  'event FarmerWithdrawal(address indexed farmer, uint256 amount, address recipient)'
];
```

### 4. Environment Configuration

**File:** `.env`

**Added:**
```env
MANTLE_REVENUE_RESERVE_ADDRESS=
```

**Note:** This must be set after deploying the CoffeeRevenueReserve contract.

### 5. Deployment Script

**File:** `scripts/mantle/deploy-revenue-reserve.cjs`

**Purpose:** Deploy CoffeeRevenueReserve contract for a specific grove

**Usage:**
```bash
node scripts/mantle/deploy-revenue-reserve.cjs <groveTokenAddress> <farmerAddress>
```

**Features:**
- Validates input addresses
- Checks deployer balance
- Deploys contract with grove token, farmer, and USDC addresses
- Outputs contract address for `.env`
- Provides explorer link

### 6. Documentation

**Created Files:**
1. `docs/FARMER_WITHDRAWAL_SETUP.md` - Complete setup guide
2. `docs/WITHDRAWAL_TESTING_GUIDE.md` - Testing procedures
3. `docs/WITHDRAWAL_IMPLEMENTATION_SUMMARY.md` - This file

## API Endpoints

### POST `/api/farmer/withdraw`

**Request:**
```json
{
  "farmerAddress": "0x...",
  "groveId": 1,
  "amount": 187.20
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "withdrawal": {
    "id": "withdrawal_1234567890_abc123",
    "farmerAddress": "0x...",
    "groveId": 1,
    "amount": 187.20,
    "status": "completed",
    "transactionHash": "0x...",
    "blockExplorerUrl": "https://explorer.sepolia.mantle.xyz/tx/0x...",
    "requestedAt": 1234567890,
    "completedAt": 1234567890
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Blockchain transaction failed: insufficient funds",
  "withdrawalId": "withdrawal_1234567890_abc123"
}
```

### GET `/api/farmer/withdrawals/:farmerAddress`

**Response:**
```json
{
  "success": true,
  "withdrawals": [
    {
      "id": "withdrawal_1234567890_abc123",
      "farmerAddress": "0x...",
      "groveId": 1,
      "amount": 187.20,
      "status": "completed",
      "transactionHash": "0x...",
      "blockExplorerUrl": "https://explorer.sepolia.mantle.xyz/tx/0x...",
      "requestedAt": 1234567890,
      "completedAt": 1234567890
    }
  ]
}
```

## Frontend Integration

**File:** `frontend/js/farmer-revenue-tracking.js`

**Already Implemented:**
- Grove selector dropdown (filters groves with available balance)
- Withdrawal form (pre-fills full available balance)
- Withdrawal submission via `window.coffeeAPI.processFarmerWithdrawal()`
- Success/error notifications
- Withdrawal history display
- Transaction links to block explorer

**No changes needed** - Frontend already calls the correct API endpoints.

## Workflow

```
1. Farmer selects grove from dropdown
   ↓
2. System displays available balance
   ↓
3. Farmer clicks "Withdraw Full Balance"
   ↓
4. Frontend calls POST /api/farmer/withdraw
   ↓
5. Backend validates balance and creates withdrawal record (status: pending)
   ↓
6. Backend connects to Mantle network via ethers.js
   ↓
7. Backend calls withdrawFarmerShare() on CoffeeRevenueReserve contract
   ↓
8. Contract transfers USDC to farmer's wallet
   ↓
9. Backend waits for transaction confirmation
   ↓
10. Backend updates withdrawal record (status: completed, tx hash)
    ↓
11. Frontend displays success notification with explorer link
    ↓
12. Farmer can view transaction on Mantle Explorer
```

## Error Handling

### Validation Errors (400)
- Missing farmer address
- Invalid withdrawal amount
- Insufficient balance

### Not Found Errors (404)
- No groves found for farmer
- Grove doesn't belong to farmer

### Blockchain Errors (500)
- Contract address not configured
- Private key not configured
- Insufficient contract balance
- Network connection issues
- Transaction reverted

**All errors are:**
- Logged to console with detailed messages
- Recorded in database (status: 'failed', errorMessage)
- Returned to frontend with user-friendly messages

## Security Considerations

1. **Private Key:** Stored in `.env`, never committed to git
2. **Balance Validation:** Checks available balance before withdrawal
3. **Transaction Confirmation:** Waits for blockchain confirmation
4. **Error Recovery:** Failed transactions don't deduct balance
5. **Access Control:** Only backend can call contract functions
6. **Audit Trail:** All withdrawals recorded in database

## Testing Checklist

- [ ] Deploy CoffeeRevenueReserve contract
- [ ] Add contract address to `.env`
- [ ] Fund contract with USDC
- [ ] Test withdrawal via API
- [ ] Verify transaction on Mantle Explorer
- [ ] Test withdrawal via UI
- [ ] Check withdrawal history
- [ ] Verify balance updates
- [ ] Test error scenarios (insufficient funds, etc.)
- [ ] Check database records

## Next Steps

### Required Before Production

1. **Deploy Contract:**
   ```bash
   node scripts/mantle/deploy-revenue-reserve.cjs <TOKEN_ADDRESS> <FARMER_ADDRESS>
   ```

2. **Update .env:**
   ```env
   MANTLE_REVENUE_RESERVE_ADDRESS=0x...
   ```

3. **Fund Contract:**
   Transfer USDC to contract address

4. **Test Thoroughly:**
   Follow `docs/WITHDRAWAL_TESTING_GUIDE.md`

### Future Enhancements

1. **Automated Funding:**
   - Modify `handleConfirmDistribution` to automatically transfer farmer share to CoffeeRevenueReserve
   - Eliminates manual funding step

2. **Multi-Grove Support:**
   - Deploy one contract per grove
   - Or use factory pattern for contract deployment
   - Update API to handle multiple contracts

3. **Batch Withdrawals:**
   - Allow farmers to withdraw from multiple groves at once
   - Reduce transaction costs

4. **Gas Optimization:**
   - Optimize contract calls
   - Use gas price estimation
   - Implement retry logic with higher gas

5. **Notification System:**
   - Email notifications for withdrawal status
   - SMS alerts for large withdrawals
   - Push notifications via web app

6. **Analytics:**
   - Track withdrawal patterns
   - Monitor gas costs
   - Alert on failed transactions

## Files Modified

1. `api/mantle-api-router.ts` - Added blockchain integration
2. `.env` - Added MANTLE_REVENUE_RESERVE_ADDRESS
3. `lib/api/contract-abis.ts` - Already had REVENUE_RESERVE_ABI

## Files Created

1. `scripts/mantle/deploy-revenue-reserve.cjs` - Deployment script
2. `docs/FARMER_WITHDRAWAL_SETUP.md` - Setup guide
3. `docs/WITHDRAWAL_TESTING_GUIDE.md` - Testing guide
4. `docs/WITHDRAWAL_IMPLEMENTATION_SUMMARY.md` - This file

## Dependencies

**Already Installed:**
- `ethers` - Ethereum library for blockchain interaction
- `drizzle-orm` - Database ORM
- `dotenv` - Environment variable management

**No new dependencies required.**

## Conclusion

The farmer withdrawal system is now fully integrated with the Mantle blockchain. Farmers can withdraw their revenue share through the UI, and all transactions are recorded on-chain with full audit trails in the database.

**Status:** ✅ Implementation Complete

**Next Action:** Deploy CoffeeRevenueReserve contract and test the system end-to-end.
