# Chai Platform - AI Coding Agent Instructions

## Project Overview

Chai Platform is a **coffee tree tokenization platform** on **Mantle Network (L2)**. It enables farmers to tokenize coffee groves as ERC-20 tokens and investors to purchase shares, with automated revenue distribution from harvests.

## Architecture

```
Frontend (Vite + Vanilla JS) → API (Express/Vercel) → Database (SQLite/Turso) + Smart Contracts (Mantle)
```

### Key Layers
- **Frontend** (`frontend/`): Vanilla JS with MetaMask integration, no framework
- **API** (`api/`): Vercel serverless functions via `api/index.ts` → `mantle-api-router.ts`
- **Database** (`db/`): Drizzle ORM with SQLite (local) or Turso (production)
- **Smart Contracts** (`contracts/mantle/`): Solidity 0.8.29, Hardhat toolchain
- **Event Indexers** (`events/`): LMDB-backed firehose/indexer pattern for blockchain events
- **Providers** (`providers/`): External market data scrapers (coffee prices)

### Service Layer (`lib/api/`)
Services follow `mantle-*-service.ts` naming. Key services:
- `mantle-contract-service.ts` - Base ethers.js wrapper for contract calls
- `mantle-tokenization-service.ts` - Grove registration and ERC-20 token creation
- `mantle-payment-service.ts` - USDC payments and withdrawals
- `mantle-lending-service.ts` - Collateralized lending with grove tokens

## Developer Commands

```bash
# Development
pnpm dev              # Frontend (port 3000) + mock API server
pnpm dev:vite         # Frontend with Vite HMR + mock API
pnpm dev:full         # Full stack: build + API + frontend + providers
pnpm api              # Real API server (port 3001) with DB

# Database
pnpm generate         # Generate Drizzle migrations
pnpm migrate          # Run migrations
pnpm studio           # Drizzle Studio UI
pnpm clean-db         # Reset DB: delete, regenerate, migrate

# Smart Contracts
pnpm compile:mantle   # Compile Solidity contracts
pnpm test:mantle      # Run Hardhat tests
pnpm deploy:mantle:testnet  # Deploy to Mantle Sepolia

# Indexers (blockchain event processing)
pnpm issuer           # Start issuer firehose + indexer
pnpm lender           # Start lender firehose + indexer
pnpm providers        # Start price + timeseries providers
```

## Database Patterns

Schema defined in `db/schema/index.ts`. Uses Drizzle ORM conventions:
- Tables use `sqliteTable()` with snake_case columns
- Indexes defined in table return object: `index("name_idx").on(table.column)`
- Amounts stored as integers (cents), timestamps as Unix ms

Key tables: `coffeeGroves`, `harvestRecords`, `tokenHoldings`, `loans`, `creditScores`, `investorWithdrawals`

```typescript
// Query pattern (db/index.ts exports `db`)
import { db } from '../db/index.js';
import { coffeeGroves } from '../db/schema/index.js';
const groves = await db.select().from(coffeeGroves).where(eq(coffeeGroves.farmerAddress, addr));
```

## Milestone-Based Funding Request System

Farmers can request funds against their grove's investment pool in milestone-based tranches:

### Milestone Types (how investments are allocated)
- **Upfront Operations (40%)** - Initial setup, equipment, labor
- **Maintenance (30%)** - Ongoing grove care, fertilizers, pest control
- **Harvest Preparation (30%)** - Pre-harvest activities, equipment prep

### Funding Flow
1. Investors buy grove tokens → funds go to `groveFundingPools` table
2. Platform allocates 40/30/30 across milestones automatically
3. Farmer submits `fundingRequests` with milestone type, amount, purpose, documents
4. Admin reviews via `admin-funding.js` → approves/rejects
5. On approval, USDC disbursed to farmer, `upfrontDisbursed`/etc. updated

### Key Tables (`db/schema/index.ts`)
```typescript
groveFundingPools     // Per-grove: totalInvestment, upfrontAllocated/Disbursed/Available, etc.
fundingRequests       // Farmer requests: milestoneType, amountRequested, status, purpose
fundingRequestDocuments // Attached invoices, receipts, photos
```

### Frontend Components
- `frontend/js/farmer-funding-requests.js` - Farmer request UI, progress bars
- `frontend/js/admin-funding.js` - Admin review dashboard

## Lending Pool System

The platform has a DeFi lending pool (`CoffeeLendingPool.sol`) enabling two-sided operations:

### For Liquidity Providers (Investors)
1. Deposit USDC → receive LP tokens (CLP-LP)
2. Earn interest from borrower repayments (8.5% base APY)
3. Withdraw anytime (if liquidity available) → burn LP tokens

### For Borrowers (Farmers)
1. Use grove tokens as collateral (125% collateralization ratio)
2. Borrow USDC from pool
3. Repay loan amount + 10% interest → get collateral back
4. Liquidation if collateral value drops below 90% threshold

### Contract Constants (`CoffeeLendingPool.sol`)
```solidity
COLLATERALIZATION_RATIO = 125  // 125% collateral required
LIQUIDATION_THRESHOLD = 90     // 90% triggers liquidation
INTEREST_RATE = 10             // 10% interest on loans
baseAPY = 850                  // 8.5% for LPs (basis points)
```

### Service Layer (`lib/api/mantle-lending-service.ts`)
```typescript
deposit(userAddress, amount)     // Provide liquidity
withdraw(userAddress, amount)    // Withdraw liquidity
borrow(borrower, collateralToken, collateralAmount, borrowAmount)
repay(borrowerAddress, loanId, amount)
```

### Frontend (`frontend/js/lending-liquidity.js`)
`LendingPoolManager` class handles caching, validation, and API calls for lending UI.

## Revenue Distribution & Fund Claiming

### Harvest Revenue Flow
1. Farmer reports harvest → `CoffeeTreeIssuerSimple.reportHarvest(groveName, yieldKg, pricePerKg)`
2. Farmer triggers distribution → `distributeRevenue(groveName, harvestIndex)`
3. Revenue split: **30% farmer / 70% investors** (proportional to token holdings)
4. `CoffeeRevenueReserve.sol` holds USDC, distributes to token holders

### Farmer Fund Claiming
**Contract**: `CoffeeRevenueReserve.withdrawFarmerShare(amount, recipient)`

**API Endpoints** (`lib/api/earnings-router.ts`):
```
GET  /api/farmer/balance/:address           → All grove balances
GET  /api/farmer/balance/:address/grove/:id → Specific grove balance
POST /api/farmer/withdraw                   → Process withdrawal
GET  /api/farmer/withdrawals/:address       → Withdrawal history
```

**Frontend**: `withdrawal-handler.js` → `withdrawFarmerShare(farmerAddress, amount, groveId)`

### Investor Fund Claiming
**Database Tables** (`db/schema/earnings-distribution.ts`):
- `investorEarnings` - Tracks earnings by type: `primary_market`, `secondary_market`, `lp_interest`
- `investorClaims` - Records claim transactions
- `investorTokenHoldings` - Tracks token ownership (primary/secondary market)

**API Endpoints** (`lib/api/investor-earnings-endpoints.ts`):
```
GET  /api/investor/balance/:address              → Balance summary
GET  /api/investor/earnings/unclaimed/:address   → Unclaimed earnings breakdown
POST /api/investor/claim                         → Process claim (earningIds[], amount)
GET  /api/investor/claims/:address               → Claim history
```

**Frontend**: `investor-earnings.js` → `InvestorEarnings` class handles UI + claim form

### LP Withdrawal (from Lending Pool)
**Contract**: `CoffeeLendingPool.withdrawLiquidity(lpTokenAmount)`
**API**: `POST /api/lending/withdraw-liquidity` → burns LP tokens, returns USDC + interest

## Blockchain Integration Patterns

### Contract ABIs (`lib/api/contract-abis.ts`)
Minimal ethers.js-compatible ABIs for each contract:
```typescript
import { USDC_ABI, ISSUER_ABI, LENDING_POOL_ABI, LP_TOKEN_ABI } from './contract-abis.js';
```

### Service Pattern for Contract Calls
All blockchain interactions go through typed service classes:

```typescript
// lib/api/mantle-contract-service.ts - Base wrapper
const service = getMantleService();
const contract = service.getContract('ISSUER', ISSUER_ABI);
const result = await service.callContract('ISSUER', ISSUER_ABI, 'methodName', ...args);
const receipt = await service.executeContract('ISSUER', ISSUER_ABI, 'methodName', ...args);

// Specialized services
getMantleTokenizationService()  // Grove operations
getMantlePaymentService()       // USDC transfers
getMantleLendingService()       // Lending pool
getMantleFarmerService()        // Farmer verification
getMantlePriceOracleService()   // Price feeds
```

### Transaction Flow Example (Token Purchase)
```typescript
// 1. Approve USDC spending
await usdcContract.approve(issuerAddress, totalCost);
// 2. Purchase tokens
await issuerContract.purchaseTreeTokens(groveName, amount);
// 3. USDC goes to CoffeeRevenueReserve, tokens transferred to buyer
```

## API Integration Patterns

### Frontend API Client (`frontend/js/api.js`)
`CoffeeTreeAPI` class wraps all endpoints:
```javascript
const api = new CoffeeTreeAPI(baseUrl);
await api.claimEarnings(distributionId, holderAddress);
await api.withdrawFarmerShare(groveId, amount, farmerAddress);
await api.depositLiquidity(assetAddress, amount);
```

### Request Headers
All authenticated requests include:
```javascript
headers: { 'x-account-id': walletAddress }
```

### API Router (`api/mantle-api-router.ts`)
Single entry point handles all routes. Pattern:
```typescript
if (url.includes('/groves/tokenize') && method === 'POST') {
  return await handleTokenizeGrove(req, res);
}
```

## Smart Contract Conventions

Contracts in `contracts/mantle/` use custom errors (not `require` strings):
```solidity
error UnverifiedFarmer(address farmer);
error GroveNotFound(string groveName);
if (grove.farmer == address(0)) revert GroveNotFound(groveName);
```

Core contracts:
- `CoffeeTreeIssuerSimple.sol` - Grove registration, tokenization, harvest reporting
- `CoffeeLendingPool.sol` - Collateralized lending with grove tokens
- `FarmerVerification.sol` - KYC/verification state
- `PriceOracle.sol` - Coffee price feeds

ABIs live in `abi/` directory and `lib/api/contract-abis.ts`.

## Frontend Patterns

No framework - vanilla JS with ES modules. Entry points are HTML files in `frontend/`.

Wallet integration via `frontend/wallet/`:
- `manager.js` - WalletManager singleton, handles MetaMask connection
- `metamask-connector.js` - Low-level MetaMask provider interaction
- Global `window.walletManager` available after DOMContentLoaded

API calls pattern (`frontend/js/api.js`):
```javascript
const response = await fetch(`${API_BASE_URL}/groves`, { headers: { 'x-account-id': address } });
```

## Environment Variables

Key variables (see `.env.example`):
- `PRIVATE_KEY` - Deployer wallet for contracts
- `MANTLE_RPC_URL` - Mantle Sepolia RPC endpoint
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` - Production DB
- `DISABLE_INVESTOR_KYC=true` - Uses in-memory mock DB (for testing without SQLite)
- Contract addresses: `MANTLE_USDC_ADDRESS`, `MANTLE_ISSUER_ADDRESS`, etc.

