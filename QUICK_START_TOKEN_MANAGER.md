# 🚀 Quick Start: Automatic Token Addition

## What You Need to Know

Your platform now **automatically adds tokens to MetaMask** when:
1. You tokenize a grove → Grove token auto-added
2. You withdraw USDC → USDC token auto-added

## Test It Right Now

### Quick Test (2 minutes)
1. Open: `http://localhost:3000/test-token-manager.html`
2. Connect MetaMask
3. Click "Add USDC to MetaMask"
4. MetaMask should prompt → Click "Add Token"
5. ✅ Done! USDC appears in wallet

### Full Test (5 minutes)
1. Go to Farmer Portal
2. Tokenize any grove
3. **Watch:** MetaMask auto-prompts to add token
4. Click "Add Token" in MetaMask
5. ✅ Token appears with balance!

## How It Works

```
Tokenize Grove → Success → MetaMask Prompts → Add Token → Token in Wallet
Withdraw USDC → Success → MetaMask Prompts → Add Token → USDC in Wallet
```

## Files Changed

✅ `frontend/js/token-manager.js` - NEW (token management)
✅ `frontend/app.html` - Added script tag
✅ `frontend/js/farmer-dashboard.js` - Auto-add after tokenization
✅ `frontend/js/farmer-revenue-tracking.js` - Auto-add after withdrawal

## What If It Doesn't Work?

1. **Check MetaMask is installed** - Look for fox icon in browser
2. **Check you're on Mantle Sepolia** - Network dropdown in MetaMask
3. **Check console for errors** - Press F12, look at Console tab
4. **Try test page** - `http://localhost:3000/test-token-manager.html`

## Manual Backup

If auto-prompt fails, manually add:

**USDC:**
- Address: `0xe96c82aBA229efCC7a46e46D194412C691feD1D5`
- Symbol: USDC
- Decimals: 6

**Grove Token:**
- Copy address from success message
- MetaMask → Import tokens → Paste address

## That's It!

No more manual token imports. Everything is automatic now! 🎉

**Questions?** Check `docs/TOKEN_MANAGER_INTEGRATION.md` for full details.
