# Frontend Migration Plan: Hedera → Mantle

## Overview
Migrate all frontend files from Hedera to Mantle/Ethereum while maintaining functionality.

---

## Files to Migrate

### 1. HTML Files (Content Updates)
- [ ] `frontend/index.html` - Update branding from "Hedera Hashgraph" to "Mantle Network"
- [ ] `frontend/app.html` - Update wallet connection prompts
- [ ] `frontend/economic-impact.html` - Update blockchain references
- [ ] `frontend/social-impact.html` - Update blockchain references
- [ ] `frontend/terms-content.html` - Update terms to reference Mantle

### 2. JavaScript Files (Code Migration)
- [ ] `frontend/js/api.js` - Update API calls and address validation
- [ ] `frontend/js/farmer-dashboard.js` - Update tokenization references
- [ ] `frontend/js/investor-earnings.js` - Update token association logic
- [ ] `frontend/js/lending-liquidity.js` - Update account validation
- [ ] `frontend/js/marketplace.js` - Update token association
- [ ] `frontend/js/transaction-history.js` - Update block explorer URLs
- [ ] `frontend/js/validation.js` - Replace Hedera account validation with Ethereum
- [ ] `frontend/js/withdrawal.js` - Update withdrawal logic
- [ ] `frontend/js/error-translator.js` - Update error messages
- [ ] `frontend/js/error-display.js` - Update network references
- [ ] `frontend/js/aria-semantic-enhancements.js` - Update accessibility labels

### 3. Backend Files (Already Marked Deprecated)
- [x] `lib/validation.ts` - Marked deprecated
- [x] `lib/api/harvest-reporting.ts` - Marked deprecated
- [x] `providers/price-provider.ts` - Marked deprecated
- [x] `providers/coffee-market-provider.ts` - Marked deprecated
- [x] `lib/utils/error-translator.ts` - Marked deprecated
- [x] `lib/services/revenue-distribution-service.ts` - Marked deprecated
- [x] `lib/services/price-oracle-service.ts` - Marked deprecated
- [x] `lib/services/loan-management-service.ts` - Marked deprecated
- [x] `lib/services/liquidation-service.ts` - Marked deprecated
- [x] `lib/services/investor-withdrawal-service.ts` - Marked deprecated
- [x] `lib/api/server.ts` - Marked deprecated
- [x] `utils.ts` - Marked deprecated

---

## Migration Strategy

### Phase 1: Validation & Address Format
**Change:** Hedera account IDs (`0.0.12345`) → Ethereum addresses (`0x...`)

**Files:**
- `frontend/js/validation.js`
- `frontend/js/api.js`
- `frontend/js/lending-liquidity.js`

**Actions:**
- Replace `validateHederaAccountId()` with `validateEthereumAddress()`
- Update regex patterns
- Update error messages

### Phase 2: Token Association
**Change:** Hedera token association → ERC-20 approval

**Files:**
- `frontend/js/marketplace.js`
- `frontend/js/investor-earnings.js`
- `frontend/js/farmer-dashboard.js`

**Actions:**
- Remove token association modals
- ERC-20 tokens don't require association
- Update success messages

### Phase 3: Block Explorer
**Change:** HashScan → Mantle Explorer

**Files:**
- `frontend/js/transaction-history.js`

**Actions:**
- Update URLs from `hashscan.io` to `explorer.testnet.mantle.xyz`

### Phase 4: Error Messages
**Change:** Hedera-specific errors → Ethereum errors

**Files:**
- `frontend/js/error-translator.js`
- `frontend/js/error-display.js`

**Actions:**
- Remove HTS error codes
- Add Ethereum/ERC-20 error messages

### Phase 5: HTML Content
**Change:** Branding and references

**Files:**
- All HTML files

**Actions:**
- Replace "Hedera Hashgraph" with "Mantle Network"
- Update logos (keep for now, can update later)
- Update FAQ answers
- Update wallet connection prompts

---

## Key Changes Summary

| Aspect | From (Hedera) | To (Mantle/Ethereum) |
|--------|---------------|----------------------|
| Account Format | `0.0.12345` | `0x1234...5678` |
| Token Standard | HTS | ERC-20 |
| Token Association | Required | Not required (approval instead) |
| Block Explorer | hashscan.io | explorer.testnet.mantle.xyz |
| Network Name | Hedera Testnet | Mantle Sepolia |
| Wallet | HashPack | MetaMask |
| Transaction Hash | `0.0.123@1234567890.123456789` | `0x1234...` |

---

## Testing Checklist

After migration:
- [ ] Wallet connection works
- [ ] Address validation works
- [ ] Token purchases work
- [ ] Withdrawals work
- [ ] Transaction history displays correctly
- [ ] Error messages are clear
- [ ] Block explorer links work
- [ ] All forms validate correctly

---

## Notes

- Backend services already migrated to Mantle
- Frontend wallet already uses MetaMask
- API already uses Mantle services
- This migration is primarily UI/UX updates
