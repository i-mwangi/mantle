# Grove Registration and Tokenization Flow

## Complete Flow (Fixed)

### Step 1: Register Grove

**What happens when you click "Register Grove":**

1. **Frontend validates form** ✅
   - Checks all required fields
   - Verifies terms acceptance

2. **Blockchain registration** ✅ (NEW!)
   - Shows notification: "Step 1/2: Registering grove on blockchain..."
   - Calls smart contract `registerCoffeeGrove()` with YOUR wallet
   - **MetaMask popup appears** - you approve the transaction
   - Waits for blockchain confirmation
   - Grove is now registered on-chain with YOU as the owner

3. **Database save** ✅
   - Shows notification: "Step 2/2: Saving to database..."
   - Saves grove details to Turso database
   - Marks as `isTokenized: false`

4. **Success** ✅
   - Shows: "Grove '{name}' registered successfully on blockchain and database!"
   - Grove card appears in your dashboard
   - Status: "Not Tokenized"

**Result:**
- ✅ Grove exists on blockchain (you own it)
- ✅ Grove exists in database
- ✅ Ready to tokenize anytime

---

### Step 2: Tokenize Grove

**What happens when you click "Tokenize Grove":**

1. **Check blockchain registration** ✅
   - API checks if grove exists on blockchain
   - If already registered: Skip to tokenization
   - If not registered: Register first (shouldn't happen with new flow)

2. **Tokenization transaction** ✅
   - Shows notification: "Tokenizing grove..."
   - Calls smart contract `tokenizeCoffeeGrove()` with YOUR wallet
   - **MetaMask popup appears** - you approve the transaction
   - Smart contract:
     - Deploys new ERC20 token contract
     - Mints tokens (trees × tokens per tree)
     - Sends all tokens to Issuer contract
     - Emits `CoffeeGroveTokenized` event

3. **Database update** ✅
   - Updates grove record:
     - `isTokenized: true`
     - `tokenAddress: 0x...`
     - `totalTokensIssued: X`
     - `tokenizedAt: timestamp`

4. **Success notification** ✅
   - Shows rich notification with:
     - Total tokens created
     - Token address (shortened)
     - Link to Mantle Explorer
   - Grove card updates to show "✅ Tokenized"

**Result:**
- ✅ ERC20 tokens created on blockchain
- ✅ Tokens held by Issuer contract
- ✅ Database updated
- ✅ Available for investors to purchase

---

## Key Differences: Before vs After Fix

### BEFORE (Broken)

**Register Grove:**
- ❌ Only saved to database
- ❌ No blockchain registration
- ❌ No MetaMask popup
- ❌ Grove owned by nobody on-chain

**Tokenize Grove:**
- ❌ Tried to register with backend wallet
- ❌ Failed because grove doesn't exist or wrong owner
- ❌ Showed fake success message
- ❌ Nothing actually happened

### AFTER (Fixed)

**Register Grove:**
- ✅ Registers on blockchain FIRST
- ✅ MetaMask popup for approval
- ✅ YOU own the grove on-chain
- ✅ Then saves to database

**Tokenize Grove:**
- ✅ Checks if already registered
- ✅ Tokenizes with YOUR wallet
- ✅ MetaMask popup for approval
- ✅ Real tokens created
- ✅ Database updated with real data

---

## MetaMask Popups

You will see MetaMask popup:

1. **When registering grove** (1 popup)
   - Approving `registerCoffeeGrove()` transaction
   - Gas fee: ~0.001 MNT

2. **When tokenizing grove** (1 popup)
   - Approving `tokenizeCoffeeGrove()` transaction
   - Gas fee: ~0.005 MNT (higher because it deploys a new contract)

**Total: 2 MetaMask popups** (1 for register, 1 for tokenize)

---

## Error Handling

### Registration Errors

**"Grove already exists"**
- A grove with this name is already registered on blockchain
- Solution: Choose a different name

**"User rejected transaction"**
- You clicked "Reject" in MetaMask
- Solution: Try again and click "Approve"

**"Insufficient funds"**
- Not enough MNT for gas fees
- Solution: Get more MNT from faucet

### Tokenization Errors

**"Grove not found"**
- Grove doesn't exist on blockchain
- Solution: Register the grove first

**"Already tokenized"**
- Grove has already been tokenized
- Solution: Check the Tokenization tab to see token details

**"Unauthorized"**
- You're not the grove owner
- Solution: Connect with the wallet that registered the grove

---

## Verification

### After Registration

**Check blockchain:**
```bash
node scripts/mantle/check-grove-owner.cjs
```

Should show:
- Owner: YOUR wallet address
- Trees: X
- Is Tokenized: false

**Check database:**
```bash
npx tsx scripts/check-groves-db.ts
```

Should show:
- Grove name
- Farmer: YOUR wallet address
- Is Tokenized: false

### After Tokenization

**Check blockchain:**
```bash
node scripts/mantle/check-token-supply.cjs
```

Should show:
- Token Address: 0x...
- Total Supply: X tokens
- Issuer Balance: 100%

**Check database:**
```bash
npx tsx scripts/check-groves-db.ts
```

Should show:
- Is Tokenized: true
- Token Address: 0x...
- Total Tokens: X

---

## Summary

**The fix ensures:**
1. ✅ Grove registration happens on blockchain with YOUR wallet
2. ✅ You own the grove on-chain
3. ✅ Tokenization works because you're the owner
4. ✅ Real tokens are created
5. ✅ Database stays in sync with blockchain
6. ✅ No fake success messages

**Now the flow is:**
Register (blockchain + database) → Tokenize (blockchain + database) → Investors can buy tokens
