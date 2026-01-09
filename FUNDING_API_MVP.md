# Funding Requests API - MVP Implementation

## Status: MVP (Minimal Viable Product)

The funding requests API endpoints have been implemented to **prevent errors** and allow the UI to load. However, the actual functionality is not yet fully implemented.

## Implemented Endpoints

### 1. GET `/api/funding/requests/:farmerAddress`
**Purpose:** Get all funding requests for a farmer

**Response:**
```json
{
  "success": true,
  "requests": [],
  "message": "Funding requests feature coming soon"
}
```

**Status:** ✅ Returns empty array (no errors)

---

### 2. GET `/api/funding/pool/:groveId`
**Purpose:** Get funding pool details for a grove

**Response:**
```json
{
  "success": true,
  "funds": {
    "totalInvestment": 0,
    "platformFeesCollected": 0,
    "upfront": { "allocated": 0, "disbursed": 0, "available": 0 },
    "maintenance": { "allocated": 0, "disbursed": 0, "available": 0 },
    "harvest": { "allocated": 0, "disbursed": 0, "available": 0 }
  },
  "message": "Funding pool feature coming soon"
}
```

**Status:** ✅ Returns empty pool (no errors)

---

### 3. POST `/api/funding/request`
**Purpose:** Create a new funding request

**Request Body:**
```json
{
  "groveId": 1,
  "farmerAddress": "0x...",
  "milestoneType": "upfront",
  "amount": 10000,
  "purpose": "Purchase equipment"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": 1234567890,
    "groveId": 1,
    "farmerAddress": "0x...",
    "milestoneType": "upfront",
    "amountRequested": 10000,
    "purpose": "Purchase equipment",
    "status": "pending",
    "createdAt": "2026-01-09T..."
  },
  "message": "Funding request created (MVP - not persisted yet)"
}
```

**Status:** ⚠️ Returns success but **doesn't persist** to database

---

### 4. GET `/api/funding/request/:requestId`
**Purpose:** Get details of a specific funding request

**Response:**
```json
{
  "success": false,
  "error": "Request not found",
  "message": "Funding requests feature coming soon"
}
```

**Status:** ⚠️ Always returns 404 (not implemented)

---

## What Works Now

✅ **No more errors** - Funding section loads without crashing
✅ **UI displays** - Shows "No funding requests yet" message
✅ **Form submission** - Returns success (but doesn't save)
✅ **API endpoints** - All respond with proper JSON

## What Doesn't Work Yet

❌ **Database persistence** - Requests are not saved
❌ **Request history** - Can't view past requests
❌ **Admin approval** - No admin workflow
❌ **Disbursement** - No actual fund transfers
❌ **File uploads** - Document attachments not stored

## Next Steps for Full Implementation

### 1. Database Schema
Create `funding_requests` table:
```sql
CREATE TABLE funding_requests (
  id INTEGER PRIMARY KEY,
  grove_id INTEGER NOT NULL,
  farmer_address TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  amount_requested INTEGER NOT NULL,
  amount_approved INTEGER,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  disbursed_at TEXT,
  transaction_id TEXT,
  rejection_reason TEXT,
  FOREIGN KEY (grove_id) REFERENCES coffee_groves(id)
);
```

### 2. Funding Pool Tracking
Create `funding_pools` table:
```sql
CREATE TABLE funding_pools (
  id INTEGER PRIMARY KEY,
  grove_id INTEGER NOT NULL UNIQUE,
  total_investment INTEGER DEFAULT 0,
  platform_fees_collected INTEGER DEFAULT 0,
  upfront_allocated INTEGER DEFAULT 0,
  upfront_disbursed INTEGER DEFAULT 0,
  maintenance_allocated INTEGER DEFAULT 0,
  maintenance_disbursed INTEGER DEFAULT 0,
  harvest_allocated INTEGER DEFAULT 0,
  harvest_disbursed INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (grove_id) REFERENCES coffee_groves(id)
);
```

### 3. Admin Approval Workflow
- Admin dashboard to review requests
- Approve/reject functionality
- Disbursement tracking

### 4. Blockchain Integration
- Smart contract for fund management
- On-chain disbursement
- Transaction verification

### 5. File Upload System
- Document storage (S3/IPFS)
- File validation
- Secure access control

## Current User Experience

**Farmer View:**
1. Goes to "Funding Requests" section ✅
2. Sees "No funding requests yet" ✅
3. Can click "Create Your First Request" ✅
4. Fills out form ✅
5. Submits request ✅
6. Gets success message ⚠️ (but not saved)
7. Request doesn't appear in list ❌ (not persisted)

**What Farmers See:**
- Clean UI without errors ✅
- Proper form validation ✅
- Success notifications ✅
- Empty state messages ✅

## Files Modified

- `api/mantle-api-router.ts` - Added 4 funding API endpoints

## Testing

**Test the endpoints:**
```bash
# Get farmer requests (returns empty array)
curl http://localhost:3001/api/funding/requests/0x123...

# Get funding pool (returns empty pool)
curl http://localhost:3001/api/funding/pool/1

# Create request (returns success but doesn't save)
curl -X POST http://localhost:3001/api/funding/request \
  -H "Content-Type: application/json" \
  -d '{"groveId":1,"farmerAddress":"0x123...","milestoneType":"upfront","amount":10000,"purpose":"Test"}'
```

## Summary

✅ **MVP Complete** - No more errors, UI loads properly
⏳ **Full Implementation** - Requires database tables and business logic
📝 **Documentation** - This file explains current state

The funding section now works without errors, but it's a placeholder implementation. Full functionality requires database schema, admin workflow, and blockchain integration.
