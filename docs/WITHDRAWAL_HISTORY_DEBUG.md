# Withdrawal History Not Showing - Debug Guide

## Problem
 though withd



# Check for specific farmer
SELECT * FROM farmer_withdrawals WHERE farmer_address = '0x81F0CC60cf0E05

**Expected:** You should see withdrawal records with:
- `id` - withdrawal ID
- `farmer_address` - farmer's wallet
- `amount` - withdrawal amount (in dollars)
- `status` - 'pending', 'completed', or 'failed'
- `transaction_hash` -

**If no records:** Withdrawals aren't being saved. Check backend logs.

### Step 3: Test API 

```bash
# Replace with your farmer address
curl "http://localhost:3001/api/farmer/withdrawals/0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9"
```

**Expected Response:**
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

**If empty array:** No withdrawals in database for this farmer.

**If error:** Check backend logs for error messages.

### Step 4: Check Browser Console

1. Open farmer dashboard: `http://localhost:3000/farmer-dashboard.html`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for these messages:

```
[Withdrawal History] Loading for farmer: 0x...
[Withdrawal History] API response: {...}
[Withdrawal History] Found X withdrawals
[Withdrawal History] Displayed X withdrawals
```

**If you see errors:**
- `Container #withdrawalHistoryList not found` - HTML element missing
- `API request failed` - Backend not responding
- `Failed to load withdrawal history` - API error

### Step 5: Check Network Tab

1. In DevTools, go to Network tab
2. Reload the page
3. Look for request to `/api/farmer/withdrawals/...`
4. Click on it to see:
   - **Status:** Should be 200
   - **Response:** Should contain withdrawal data

**If 404:** Endpoint not found - check backend routing
**If 500:** Server error - check backend logs
**If no request:** Frontend not calling API - check console for errors

## Common Issues & Fixes

### Issue 1: "No withdrawal history yet" but withdrawals exist in database

**Cause:** Frontend not calling API or API returning empty array

**Fix:**
1. Check browser console for errors
2. Verify API endpoint is correct: `/api/farmer/withdrawals/:address`
3. Check farmer address matches exactly (case-sensitive)

### Issue 2: Withdrawal amounts showing as $0.00

**Cause:** Values being divided by 100 (treating dollars as cents)

**Fix:** Already fixed in code - values are stored as dollars, not cents

### Issue 3: Transaction links not showing

**Cause:** `blockExplorerUrl` is null or empty

**Fix:** Check if withdrawal completed successfully:
```sql
SELECT transaction_hash, block_explorer_url, status 
FROM farmer_withdrawals 
WHERE farmer_address = '0x...';
```

If `status = 'failed'`, check `error_message` field.

### Issue 4: Withdrawal status stuck on "Pending"

**Cause:** Blockchain transaction failed or not confirmed

**Fix:**
1. Check backend logs for transaction errors
2. Verify `MANTLE_REVENUE_RESERVE_ADDRESS` is set in `.env`
3. Check contract is funded with USDC
4. Check `error_message` in database:
```sql
SELECT id, status, error_message 
FROM farmer_withdrawals 
WHERE status = 'pending' OR status = 'failed';
```

## Manual Test

### Test Withdrawal Flow End-to-End

1. **Start Backend:**
   ```bash
   npm run dev
   ```

2. **Open Farmer Dashboard:**
   ```
   http://localhost:3000/farmer-dashboard.html
   ```

3. **Connect Wallet:**
   - Click "Connect Wallet"
   - Approve MetaMask

4. **Make a Withdrawal:**
   - Go to "Revenue Tracking" section
   - Select a grove
   - Click "Withdraw Full Balance"
   - Wait for confirmation

5. **Check Withdrawal History:**
   - Scroll to "Withdrawal History" section
   - Should see the new withdrawal
   - Click transaction link to verify on blockchain

6. **Verify in Database:**
   ```sql
   SELECT * FROM farmer_withdrawals 
   ORDER BY requested_at DESC 
   LIMIT 1;
   ```

## Code Locations

**Frontend:**
- Withdrawal history display: `frontend/js/farmer-dashboard.js` (line ~3833)
- API call: `frontend/js/api.js` (line ~494)

**Backend:**
- Withdrawal endpoint: `api/mantle-api-router.ts` (line ~1054)
- Get withdrawals endpoint: `api/mantle-api-router.ts` (line ~892)

**Database:**
- Table: `farmer_withdrawals`
- Schema: `db/schema/index.ts` (line ~437)

## Quick Fixes

### Fix 1: Reload Withdrawal History Manually

In browser console:
```javascript
// Get farmer address
const farmerAddress = window.walletManager.getAccountId();

// Reload withdrawal history
window.farmerDashboard.loadWithdrawalHistory(farmerAddress);
```

### Fix 2: Check if Element Exists

In browser console:
```javascript
// Check if container exists
const container = document.getElementById('withdrawalHistoryList');
console.log('Container found:', !!container);
console.log('Container HTML:', container?.innerHTML);
```

### Fix 3: Test API Directly

In browser console:
```javascript
// Test API
const farmerAddress = window.walletManager.getAccountId();
const response = await window.coffeeAPI.getFarmerWithdrawalHistory(farmerAddress);
console.log('API Response:', response);
```

## Expected Behavior

**After successful withdrawal:**
1. ✅ Notification: "Withdrawal processed successfully"
2. ✅ Database: New record in `farmer_withdrawals` table
3. ✅ Withdrawal History: Shows new withdrawal with:
   - Date and time
   - Amount ($XXX.XX)
   - Status (✅ Completed / ⏳ Pending / ❌ Failed)
   - Transaction link (if completed)
   - Error message (if failed)
4. ✅ Balance: Available balance decreases
5. ✅ Blockchain: Transaction visible on Mantle Explorer

## Still Not Working?

1. **Check backend logs** for errors during withdrawal
2. **Check browser console** for JavaScript errors
3. **Verify database** has withdrawal records
4. **Test API endpoint** directly with curl
5. **Check network tab** for failed requests

## Contact Support

If issue persists, provide:
1. Backend logs (last 50 lines)
2. Browser console output
3. Database query results
4. Network tab screenshot
5. Farmer wallet address
6. Transaction hash (if available)
