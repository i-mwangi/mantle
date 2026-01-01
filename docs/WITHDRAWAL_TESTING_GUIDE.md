# Farmer Withdrawal System - Testing Guide

Quick guide for testing the farmer withdrawal system end-to-end.

## Prerequisites Checklist

- [ ] Backend API running on `http://localhost:3001`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Database has distributed harvests with `revenueDistributed = true`
- [ ] `MANTLE_REVENUE_RESERVE_ADDRESS` set in `.env`
- [ ] `CoffeeRevenueReserve` contract deployed and funded with USDC
- [ ] Farmer wallet connected (MetaMask)

## Quick Test Steps

### 1. Deploy Revenue Reserve Contract

```bash
# Compile contracts first
npx hardhat compile

# Deploy for a specific grove
node scripts/mantle/deploy-revenue-reserve.cjs <GROVE_TOKEN_ADDRESS> <FARMER_ADDRESS>

# Example:
node scripts/mantle/deploy-revenue-reserve.cjs 0xaf4da1406A8EE17AfEF5AeE644481a6b1cB01a9c 0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9
```

**Copy the deployed contract address and add to `.env`:**
```env
MANTLE_REVENUE_RESERVE_ADDRESS=0x...
```

### 2. Fund the Contract with USDC

Transfer USDC to the deployed contract address. The contract needs enough USDC to cover all farmer withdrawals.

**Check contract balance:**
```bash
# Using cast (foundry)
cast call <CONTRACT_ADDRESS> "getBalance()" --rpc-url https://rpc.sepolia.mantle.xyz

# Or check on Mantle Explorer
https://explorer.sepolia.mantle.xyz/address/<CONTRACT_ADDRESS>
```

### 3. Verify Farmer Has Available Balance

**API Request:**
```bash
curl "http://localhost:3001/api/revenue/farmer-balance?farmerAddress=0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9"
```

**Expected Response:**
```json
{
  "success": true,
  "availableBalance": 2187.00,
  "groveBalances": [
    {
      "groveId": 1,
      "groveName": "mwenya",
      "availableBalance": 187.20
    }
  ]
}
```

### 4. Test Withdrawal via API

**Request:**
```bash
curl -X POST http://localhost:3001/api/farmer/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "farmerAddress": "0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9",
    "groveId": 1,
    "amount": 187.20
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "withdrawal": {
    "id": "withdrawal_...",
    "transactionHash": "0x...",
    "blockExplorerUrl": "https://explorer.sepolia.mantle.xyz/tx/0x...",
    "status": "completed"
  }
}
```

**Failure Response:**
```json
{
  "success": false,
  "error": "Blockchain transaction failed: insufficient funds",
  "withdrawalId": "withdrawal_..."
}
```

### 5. Verify Transaction on Blockchain

Visit the block explorer URL from the response:
```
https://explorer.sepolia.mantle.xyz/tx/0x...
```

Check:
- Transaction status: Success ✅
- From: Backend wallet address
- To: CoffeeRevenueReserve contract
- Method: `withdrawFarmerShare`
- USDC transferred to farmer

### 6. Test via Farmer Dashboard UI

1. **Open Dashboard:**
   ```
   http://localhost:3000/farmer-dashboard.html
   ```

2. **Connect Wallet:**
   - Click "Connect Wallet"
   - Approve MetaMask connection

3. **Navigate to Revenue Tracking:**
   - Scroll to "Revenue Tracking" section
   - Verify metrics show correct values

4. **Select Grove for Withdrawal:**
   - Open "Grove Withdrawal" dropdown
   - Select a grove with available balance
   - Full balance is pre-filled

5. **Submit Withdrawal:**
   - Click "Withdraw Full Balance"
   - Wait for processing (shows loading notification)
   - Success notification appears
   - Transaction link to block explorer

6. **Check Withdrawal History:**
   - Scroll to "Withdrawal History"
   - See the new withdrawal record
   - Click transaction link to view on explorer

### 7. Verify Database Records

**Check withdrawal record:**
```sql
SELECT * FROM farmer_withdrawals 
WHERE farmer_address = '0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9'
ORDER BY requested_at DESC
LIMIT 1;
```

**Expected fields:**
- `status`: 'completed'
- `transaction_hash`: '0x...'
- `block_explorer_url`: 'https://...'
- `completed_at`: timestamp
- `error_message`: null

### 8. Verify Balance Updated

**Check updated balance:**
```bash
curl "http://localhost:3001/api/revenue/farmer-balance?farmerAddress=0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9"
```

**Expected:**
- `availableBalance` decreased by withdrawal amount
- `totalWithdrawn` increased by withdrawal amount

## Common Test Scenarios

### Scenario 1: Insufficient Contract Balance

**Setup:**
- Contract has 100 USDC
- Farmer tries to withdraw 200 USDC

**Expected:**
- Transaction fails
- Error: "insufficient funds" or similar
- Withdrawal status: 'failed'
- Error message recorded in database

### Scenario 2: Multiple Groves

**Setup:**
- Farmer has 3 groves with balances
- Grove A: $100, Grove B: $200, Grove C: $300

**Test:**
1. Withdraw from Grove A
2. Verify Grove A balance = 0
3. Verify Grove B and C unchanged
4. Withdraw from Grove B
5. Verify total withdrawn = $300

### Scenario 3: No Available Balance

**Setup:**
- Farmer has no distributed harvests
- Or all harvests already withdrawn

**Expected:**
- Grove dropdown shows "No groves with available balance"
- Withdrawal button disabled
- API returns error if attempted

### Scenario 4: Failed Transaction Recovery

**Setup:**
- First withdrawal fails (contract not funded)
- Fund the contract
- Retry withdrawal

**Expected:**
- First withdrawal: status = 'failed'
- Second withdrawal: status = 'completed'
- Both records in database
- Balance only decreases on successful withdrawal

## Debugging Tips

### Check Backend Logs

```bash
# Start backend with verbose logging
npm run dev

# Look for these log messages:
# 💰 Processing farmer withdrawal
# 🔗 Initiating blockchain withdrawal
# 🔗 Transaction sent: 0x...
# ✅ Transaction confirmed in block: 12345
# ✅ Withdrawal completed successfully
```

### Check Contract State

```bash
# Get contract farmer address
cast call <CONTRACT_ADDRESS> "farmer()" --rpc-url https://rpc.sepolia.mantle.xyz

# Get contract USDC balance
cast call <CONTRACT_ADDRESS> "getBalance()" --rpc-url https://rpc.sepolia.mantle.xyz

# Get grove token address
cast call <CONTRACT_ADDRESS> "groveToken()" --rpc-url https://rpc.sepolia.mantle.xyz
```

### Check Database State

```sql
-- All withdrawals for a farmer
SELECT * FROM farmer_withdrawals 
WHERE farmer_address = '0x...'
ORDER BY requested_at DESC;

-- Failed withdrawals
SELECT * FROM farmer_withdrawals 
WHERE status = 'failed';

-- Pending withdrawals (stuck?)
SELECT * FROM farmer_withdrawals 
WHERE status = 'pending' 
AND requested_at < (strftime('%s', 'now') - 300) * 1000; -- older than 5 min
```

### Check Harvest Distribution

```sql
-- Distributed harvests for a farmer
SELECT h.*, g.grove_name 
FROM harvest_records h
JOIN coffee_groves g ON h.grove_id = g.id
WHERE g.farmer_address = '0x...'
AND h.revenue_distributed = 1;

-- Total farmer share available
SELECT SUM(h.farmer_share) as total_available
FROM harvest_records h
JOIN coffee_groves g ON h.grove_id = g.id
WHERE g.farmer_address = '0x...'
AND h.revenue_distributed = 1;
```

## Performance Testing

### Load Test: Multiple Withdrawals

```bash
# Test 10 sequential withdrawals
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/farmer/withdraw \
    -H "Content-Type: application/json" \
    -d "{\"farmerAddress\":\"0x...\",\"groveId\":1,\"amount\":10}"
  sleep 2
done
```

**Monitor:**
- Transaction confirmation times
- Database write performance
- API response times
- Gas costs per transaction

## Success Criteria

✅ **Deployment:**
- Contract deploys successfully
- Contract address added to `.env`
- Contract funded with USDC

✅ **API:**
- Balance endpoint returns correct values
- Withdrawal endpoint processes successfully
- Withdrawal history endpoint returns records

✅ **Blockchain:**
- Transaction appears on Mantle Explorer
- USDC transferred to farmer
- Event emitted: `FarmerShareWithdrawn`

✅ **Database:**
- Withdrawal record created with status 'pending'
- Record updated to 'completed' after confirmation
- Transaction hash and explorer URL saved

✅ **UI:**
- Grove dropdown populated correctly
- Withdrawal form submits successfully
- Success notification displayed
- Withdrawal history updated
- Balance metrics updated

## Next Steps After Testing

1. **Deploy for Production:**
   - Deploy contracts to Mantle Mainnet
   - Update `.env` with mainnet addresses
   - Test with small amounts first

2. **Monitor System:**
   - Set up alerts for failed withdrawals
   - Monitor contract USDC balance
   - Track gas costs

3. **Optimize:**
   - Batch withdrawals if possible
   - Optimize gas usage
   - Cache balance calculations

4. **Document:**
   - Record all contract addresses
   - Document deployment process
   - Create runbook for operations

## Support

If tests fail, check:
1. Backend logs for detailed errors
2. Blockchain transaction on explorer
3. Contract balance and state
4. Database records
5. Environment variables

For persistent issues, review:
- [Farmer Withdrawal Setup Guide](./FARMER_WITHDRAWAL_SETUP.md)
- [CoffeeRevenueReserve Contract](../contracts/mantle/CoffeeRevenueReserve.sol)
- [API Implementation](../api/mantle-api-router.ts)
