Yes! There's still a lot of Hedera code in your repo, mainly in:

Files Still Using Hedera:
1. api/index.ts - Your backend API
Uses Hedera token service
Uses Hedera withdrawal service
Uses Hedera payment service
Validates Hedera account IDs (0.0.xxxxx format)
2. .env - Environment variables
Full of Hedera configuration
Hedera account IDs
Hedera token IDs
Hedera network settings
3. lib/ folder (likely)
hedera-token-service.js
hedera-withdrawal-service.js
hedera-payment-service.js
What We've Done So Far:
✅ Migrated smart contracts (in contracts/mantle/)
✅ Moved old Hedera contracts to deprecated/
✅ Created deployment scripts for Mantle

What Still Needs Migration:
⏳ Backend API (api/index.ts) - Still uses Hedera services
⏳ Frontend - Still uses HashPack wallet
⏳ Database - Still expects Hedera account format
⏳ Environment - Still has Hedera config

Current Status:
Your project is hybrid:

✅ Smart contracts → Ready for Mantle
⏳ Backend/Frontend → Still on Hedera
Next Steps:
Option A: Deploy contracts to Mantle first (what we're doing now)

npx hardhat run scripts/mantle/deploy.ts --network hardhat
Option B: Migrate backend/frontend (after contracts work)

Which would you like to focus on?

Deploy Mantle contracts now (test they work)
Migrate backend API (update to use ethers.js)
See what Hedera files exist (audit the codebase)
I recommend #1 - let's deploy the contracts and prove they work, then migrate the rest! 🚀