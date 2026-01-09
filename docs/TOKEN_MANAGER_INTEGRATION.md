# Token Manager Integration

## Overview
Automatic token addition to MetaMask after grove tokenization and USDC withdrawals.

## Features

### 1. Automatic Grove Token Addition
When a farmer tokenizes a grove, the system automatically prompts MetaMask to add the grove token.

**Flow:**
1. Farmer tokenizes grove on blockchain
2. Transaction confirms
3. Success notification appears
4. MetaMask automatically prompts to add token
5. Token appears in wallet with grove name as symbol

### 2. Automatic USDC Token Addition
After a successful withdrawal, the system prompts to add USDC token to MetaMask.

**Flow:**
1. Farmer completes withdrawal
2. USDC transferred to wallet
3. 2-second delay (for UX)
4. MetaMask prompts to add USDC token
5. USDC balance visible in wallet

## Implementation Details

### Files Modified

#### 1. `frontend/js/token-manager.js` (NEW)
- `TokenManager` class with methods:
  - `addTokenToMetaMask()` - Generic ERC20 token addition
  - `addUSDCToken()` - Add USDC (Mantle Sepolia)
  - `addGroveToken()` - Add grove token with auto-generated symbol
  - `autoAddTokenAfterTokenization()` - Auto-prompt after tokenization

#### 2. `frontend/app.html`
- Added `<script src="/js/token-manager.js"></script>` to load token manager

#### 3. `frontend/js/farmer-dashboard.js`
- Integrated `autoAddTokenAfterTokenization()` in tokenization success handler
- Calls token manager after successful blockchain tokenization

#### 4. `frontend/js/farmer-revenue-tracking.js`
- Integrated `addUSDCToken()` in withdrawal success handler
- Prompts to add USDC after successful withdrawal

## Token Details

### USDC Token (Mantle Sepolia)
- **Address:** `0xe96c82aBA229efCC7a46e46D194412C691feD1D5`
- **Symbol:** USDC
- **Decimals:** 6
- **Logo:** USDC logo from cryptologos.cc

### Grove Tokens
- **Symbol:** Auto-generated from grove name (max 11 chars, uppercase)
- **Decimals:** 18 (standard ERC20)
- **Address:** Generated during tokenization

## User Experience

### Tokenization Flow
```
1. Farmer clicks "Tokenize Grove"
2. MetaMask prompts for transaction approval
3. Transaction confirms on blockchain
4. Success notification appears
5. MetaMask automatically prompts: "Add MWENYA token?"
6. User clicks "Add Token"
7. Token appears in MetaMask with balance
```

### Withdrawal Flow
```
1. Farmer submits withdrawal
2. Transaction processes on blockchain
3. USDC transferred to wallet
4. Success notification appears
5. MetaMask automatically prompts: "Add USDC token?"
6. User clicks "Add Token"
7. USDC balance visible in MetaMask
```

## Testing

### Test Page
Open `frontend/test-token-manager.html` to test:
1. USDC token addition
2. Grove token addition
3. Tokenization flow simulation
4. MetaMask connection check

### Manual Testing
1. **Test Tokenization:**
   - Register a grove
   - Tokenize the grove
   - Verify MetaMask prompts to add token
   - Check token appears in wallet

2. **Test Withdrawal:**
   - Complete a withdrawal
   - Verify MetaMask prompts to add USDC
   - Check USDC balance in wallet

## Error Handling

### MetaMask Not Installed
- Token manager checks for `window.ethereum`
- Returns `false` if not available
- Logs error to console

### User Declines
- If user clicks "Cancel" in MetaMask prompt
- Returns `false` but doesn't throw error
- Logs to console

### Network Issues
- Catches and logs errors
- Returns `false` on failure
- Doesn't block main flow

## Configuration

### Contract Addresses
Located in `frontend/js/token-manager.js`:
```javascript
const usdcAddress = '0xe96c82aBA229efCC7a46e46D194412C691feD1D5'; // Mantle Sepolia
```

### Token Symbols
- USDC: Fixed as "USDC"
- Grove tokens: Auto-generated from grove name
  - Example: "Mwenya Grove" → "MWENYA"
  - Max 11 characters (MetaMask limit)

## Browser Compatibility
- Chrome/Brave with MetaMask: ✅ Full support
- Firefox with MetaMask: ✅ Full support
- Safari: ⚠️ MetaMask extension required
- Mobile: ⚠️ Use MetaMask mobile browser

## Future Enhancements
1. Add "Add to MetaMask" buttons in UI as backup
2. Check if token already added before prompting
3. Add token logos for grove tokens
4. Support other wallets (WalletConnect, etc.)
5. Add token to wallet on grove registration (before tokenization)

## Troubleshooting

### Token Not Appearing
1. Check MetaMask is on Mantle Sepolia network
2. Verify token address is correct
3. Try manually adding token using address
4. Check browser console for errors

### MetaMask Not Prompting
1. Ensure MetaMask is unlocked
2. Check no other MetaMask prompts are open
3. Verify `window.ethereum` is available
4. Try refreshing the page

### Wrong Network
1. Switch MetaMask to Mantle Sepolia
2. Network ID: 5003 (0x138b)
3. RPC: https://rpc.sepolia.mantle.xyz

## Support
For issues or questions:
1. Check browser console for errors
2. Test using `test-token-manager.html`
3. Verify MetaMask connection
4. Check network is Mantle Sepolia
