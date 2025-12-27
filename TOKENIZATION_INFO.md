# How Farmers See Their Tokenization Information

## After Clicking "Tokenize Grove"

### 1. Success Notification (Popup)
When tokenization completes successfully, you'll see:
- **Title**: "🎉 Grove Tokenized Successfully!"
- **Total Tokens Created**: e.g., "10,000 tokens created for moonrise"
- **Token Address**: Short version (e.g., `0xa1A2209E11...81D6d6170`)
- **Link**: "View on Mantle Explorer" - click to see on blockchain
- **Duration**: Shows for 10 seconds

### 2. Grove Card (Main Dashboard)
Each grove card now shows:

**If Tokenized:**
- ✅ **Tokenization Status**: "✅ Tokenized" (green)
- 🪙 **Total Tokens**: e.g., "10,000"
- 📍 **Token Address**: Shortened (e.g., `0xa1A2209E...6d6170`)

**If Not Tokenized:**
- ⏳ **Tokenization Status**: "⏳ Not Tokenized" (yellow)

### 3. Manage Grove Modal - Tokenization Tab

**If Already Tokenized:**
Shows a green success card with:
- ✅ "Grove Already Tokenized"
- **Total Tokens**: Full number (e.g., 10,000)
- **Token Address**: Full address in a code block
- **Button**: "View on Mantle Explorer" - opens blockchain explorer
- **Note**: Explains tokens are held by Issuer contract for investors

**If Not Yet Tokenized:**
Shows the tokenization form with:
- Input fields for token amount, price, projected return
- Pre-filled suggestion (10 tokens per tree)
- "Tokenize Grove" button

### 4. Console Log (For Developers)
After successful tokenization, check browser console for:
```javascript
{
  groveName: "moonrise",
  tokenAddress: "0xa1A2209E11d088a2547516EBe12B00781D6d6170",
  totalSupply: "10000",
  transactionHash: "0xd5a9cf...",
  explorerUrl: "https://sepolia.mantlescan.xyz/address/0xa1A2..."
}
```

## Important Notes

### Where Are The Tokens?
- **NOT in your wallet** - Tokens are held by the Issuer contract
- **Available for investors** - Investors purchase tokens from the contract
- **You track revenue** - See token sales and earnings in Revenue section

### How to Verify Tokenization
1. **Check grove card** - Look for "✅ Tokenized" status
2. **Click "Manage"** - Go to Tokenization tab to see full details
3. **View on Explorer** - Click the explorer link to see on blockchain
4. **Check database** - Grove record updated with `isTokenized: true`

### Token Information Stored
When a grove is tokenized, the database stores:
- `isTokenized`: true
- `tokenAddress`: Full ERC20 token contract address
- `totalTokensIssued`: Total number of tokens minted
- `tokenizedAt`: Timestamp of tokenization

### Blockchain Explorer
Click "View on Mantle Explorer" to see:
- Token contract details
- Total supply
- Token holders (investors who purchased)
- Transaction history
- Contract code

## Example Flow

1. **Register Grove**: "moonrise" with 1,000 trees
2. **Click Manage**: Open grove management modal
3. **Go to Tokenization Tab**: See tokenization form
4. **Fill Form**: 
   - Total Tokens: 10,000 (10 per tree)
   - Price: $5.00 per token
   - Return: 12.5% annual
5. **Click "Tokenize Grove"**: MetaMask popup appears (twice)
6. **Approve Transactions**: Pay gas fees in MNT
7. **See Success Message**: Shows token address and link
8. **Grove Card Updates**: Now shows "✅ Tokenized" with token info
9. **Investors Can Buy**: Tokens now available in investor portal

## Revenue Tracking (Coming Soon)
Future features will show:
- How many tokens have been sold
- Revenue generated from token sales
- Your share of harvest revenue
- Withdrawal history
