# How to Get Testnet MNT - Multiple Options

Your wallet address: `0x1d36088356C8282B4156D5b4d56E3F5f49eF1e56`

---

## Option 1: Mantle Discord (Most Reliable)

1. **Join Mantle Discord:** https://discord.gg/mantle
2. **Go to #faucet channel**
3. **Type:** `/faucet 0x1d36088356C8282B4156D5b4d56E3F5f49eF1e56`
4. **Wait for bot response** (~30 seconds)

✅ **This usually works best!**

---

## Option 2: Alternative Faucets

### A. L2 Faucet
- **URL:** https://www.l2faucet.com/mantle
- **Enter address:** `0x1d36088356C8282B4156D5b4d56E3F5f49eF1e56`
- **Click:** Request MNT

### B. Mantle Faucet (if working)
- **URL:** https://faucet.testnet.mantle.xyz
- **Requirements:**
  1. Get Sepolia ETH first from: https://www.alchemy.com/faucets/ethereum-sepolia
  2. Switch MetaMask to Sepolia
  3. Connect wallet and mint

### C. QuickNode Multi-Chain Faucet
- **URL:** https://faucet.quicknode.com/drip
- **Select:** Mantle Testnet
- **Enter address:** `0x1d36088356C8282B4156D5b4d56E3F5f49eF1e56`

---

## Option 3: Deploy to Local Network First (No MNT Needed)

You can test everything locally without testnet MNT:

```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/mantle/deploy.ts --network hardhat
```

This gives you a local blockchain to test with!

---

## Option 4: Use a Different Testnet Temporarily

If Mantle faucets are all down, you could:

1. **Deploy to Ethereum Sepolia** (easier to get testnet ETH)
2. **Test everything there first**
3. **Deploy to Mantle later**

Would you like me to create a Sepolia deployment config?

---

## Check Your Balance

After getting MNT from any faucet:

```bash
node scripts/mantle/check-balance.cjs
```

---

## If All Faucets Fail

**Contact Mantle Support:**
- Discord: https://discord.gg/mantle
- Twitter: @MantleNetwork
- Telegram: https://t.me/mantlenetwork

They can manually send testnet MNT if faucets are down.

---

## Recommended: Try Discord First

The Discord faucet is usually the most reliable. Join and request MNT there!
