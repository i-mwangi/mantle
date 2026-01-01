# Farmer Withdrawal System - Setup Guide

This guide explains how to set up and use the blockchain-integrated farmer withdrawal system.

## Overview

The farmer withdrawal system allows farmers to withdraw their revenue share from distributed harvests. The system integrates with the `CoffeeRevenueReserve` smart contract on Mantle Sepolia to process withdrawals on-chain.

## Architecture

```
┌─────────────────┐
│  Farmer UI      │
│  (Dashboard)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Backend    │
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Contract │
│  (Mantle)       │
└─────────────────┘
```

## Prerequisites

1. **Deployed Contracts:**
   - `CoffeeRevenueReserve` contract deployed on Mantle Sepolia
   - Contract must be funded with USDC for withdrawals

2. **Environment Variables:**
   - `MANTLE_REVENUE_RESERVE_ADDRESS` - Address of deployed CoffeeRevenueReserve contract
   - `MANTLE_RPC_URL` - Mantle Sepolia RPC URL
   - `PRIVATE_KEY` - Private key for signing transactions
   - `MANTLE_USDC_ADDRESS` - USDC token address on Mantle Sepolia

3. **Database:**
   - `farmerWithdrawals` table must exist (already in schema)
   - `harvestRecords` table with distributed harvests

## Step 1: Deploy CoffeeRevenueReserve Contract

For each tokenized grove, you need to deploy a separate `CoffeeRevenueReserve` contract.

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy Contract

```bash
node scripts/mantle/deploy-revenue-reserve.cjs <groveTokenAddress> <farmerAddress>
```

**Example:**
```bash
node scripts/mantle/deploy-revenue-reserve.cjs 0x123...abc 0x456...def
```

**Parameters:**
- `groveTokenAddress` - Address of the grove's ERC20 token
- `farmerAddress` - Wallet address of the farmer

### Update .env

After deployment, add the contract address to `.env`:

```env
MANTLE_REVENUE_RESERVE_ADDRESS=0x...
```

## Step 2: Fund the Revenue Reserve Contract

The `CoffeeRevenueReserve` contract must hold USDC to process withdrawals.

### Option A: Manual Transfer

Transfer USDC directly to the contract address using MetaMask or another wallet.

### Option B: Automated Funding (Recommended)

When revenue is distributed (via `handleConfirmDistribution`), the system should:

1. Calculate farmer and investor shares
2. Transfer investor share to token holders
3. Transfer farmer share to `CoffeeRevenueReserve` contract

**TODO:** Implement automated funding in `handleConfirmDistribution` function.

## Step 3: Test the Withdrawal Flow

### 1. Check Farmer Balance

```bash
curl "http://localhost:3001/api/revenue/farmer-balance?farmerAddress=0x..."
```

**Response:**
```json
{
  "success": true,
  "farmerAddress": "0x...",
  "availableBalance": 2187.00,
  "pendingDistribution": 0,
  "totalDistributed": 2187.00,
  "totalWithdrawn": 0,
  "thisMonthDistribution": 2187.00,
  "groveBalances": [
    {
      "groveId": 1,
      "groveName": "mwenya",
      "availableBalance": 187.20
    }
  ]
}
```

### 2. Process Withdrawal

```bash
curl -X POST http://localhost:3001/api/farmer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "farmerAddress": "0x...",
    "groveId": 1,
    "amount": 187.20
  }'
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

### 3. Check Withdrawal History

```bash
curl "http://localhost:3001/api/farmer/withdrawals/0x..."
```

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

## Step 4: Use the Farmer Dashboard UI

### Access Dashboard

Navigate to: `http://localhost:3000/farmer-dashboard.html`

### Revenue Tracking Section

The dashboard displays:

1. **This Month's Distribution** - Revenue distributed this month
2. **Available Balance** - Total available for withdrawal
3. **Pending Distribution** - Revenue calculated but not yet distributed
4. **Total Withdrawn** - Cumulative withdrawals

### Grove Withdrawal

1. Select a grove from the dropdown (only groves with available balance)
2. The full available balance is pre-filled
3. Click "Withdraw Full Balance"
4. Transaction is processed on-chain
5. View transaction on Mantle Explorer

### Withdrawal History

View all past withdrawals with:
- Date and time
- Amount
- Status (pending, completed, failed)
- Transaction link to block explorer
- Error messages (if failed)

## Troubleshooting

### Error: "MANTLE_REVENUE_RESERVE_ADDRESS not configured"

**Solution:** Deploy the `CoffeeRevenueReserve` contract and add the address to `.env`.

### Error: "Insufficient balance"

**Cause:** The `CoffeeRevenueReserve` contract doesn't have enough USDC.

**Solution:** Transfer USDC to the contract address.

### Error: "Blockchain transaction failed"

**Possible Causes:**
1. Contract not funded with USDC
2. Farmer address doesn't match contract's farmer address
3. Network issues
4. Gas price too low

**Solution:** Check contract balance, verify farmer address, and retry.

### Withdrawal Status: "failed"

Check the `errorMessage` field in the withdrawal record:

```sql
SELECT * FROM farmer_withdrawals WHERE status = 'failed';
```

## Database Schema

### farmerWithdrawals Table

```typescript
{
  id: string;                    // Unique withdrawal ID
  farmerAddress: string;         // Farmer's wallet address
  groveId: number | null;        // Grove ID (null for all groves)
  amount: number;                // Amount in dollars
  status: string;                // 'pending' | 'completed' | 'failed'
  transactionHash: string | null;// Blockchain transaction hash
  blockExplorerUrl: string | null; // Link to block explorer
  errorMessage: string | null;   // Error message if failed
  requestedAt: number;           // Timestamp of request
  completedAt: number | null;    // Timestamp of completion
  createdAt: number;             // Record creation timestamp
  updatedAt: number;             // Record update timestamp
}
```

## Smart Contract Interface

### CoffeeRevenueReserve.sol

```solidity
contract CoffeeRevenueReserve {
    address public groveToken;
    address public farmer;
    address public usdc;
    
    function withdrawFarmerShare(uint256 _amount, address _recipient) external;
    function getBalance() external view returns (uint256);
}
```

### Key Functions

**withdrawFarmerShare(amount, recipient)**
- Transfers USDC from contract to farmer
- Only callable by authorized addresses
- Emits `FarmerShareWithdrawn` event

**getBalance()**
- Returns USDC balance of contract
- Used to check if contract is funded

## Security Considerations

1. **Private Key Security:** Never commit `PRIVATE_KEY` to version control
2. **Access Control:** Only authorized backend can call withdrawal functions
3. **Balance Validation:** System checks available balance before withdrawal
4. **Transaction Confirmation:** Waits for blockchain confirmation before marking complete
5. **Error Handling:** Failed transactions are recorded with error messages

## Future Enhancements

1. **Multi-Grove Support:** Deploy one contract per grove or use a factory pattern
2. **Automated Funding:** Automatically fund contract during revenue distribution
3. **Batch Withdrawals:** Allow farmers to withdraw from multiple groves at once
4. **Gas Optimization:** Optimize contract calls to reduce gas costs
5. **Notification System:** Email/SMS notifications for withdrawal status

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review blockchain transaction on Mantle Explorer
3. Check backend logs for detailed error messages
4. Verify contract is deployed and funded

## References

- [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz/)
- [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)
- [CoffeeRevenueReserve Contract](../contracts/mantle/CoffeeRevenueReserve.sol)
- [API Router Implementation](../api/mantle-api-router.ts)
