/**
 * Contract ABIs for Mantle Network
 * Minimal ABIs with only the functions we need
 */

// MockUSDC ABI
export const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function mint(address to, uint256 amount)',
];

// FarmerVerification ABI
export const FARMER_VERIFICATION_ABI = [
  'function verifyFarmer(address farmer)',
  'function isVerified(address farmer) view returns (bool)',
  'function revokeVerification(address farmer)',
  'event FarmerVerified(address indexed farmer, uint256 timestamp)',
  'event VerificationRevoked(address indexed farmer, uint256 timestamp)',
];

// PriceOracle ABI
export const PRICE_ORACLE_ABI = [
  'function updatePrice(uint256 newPrice)',
  'function getPrice() view returns (uint256)',
  'function getLastUpdateTime() view returns (uint256)',
  'event PriceUpdated(uint256 newPrice, uint256 timestamp)',
];

// CoffeeTreeIssuer ABI
export const ISSUER_ABI = [
  // Registration
  'function registerCoffeeGrove(string memory groveName, string memory location, uint64 treeCount, string memory coffeeVariety, uint64 expectedYieldPerTree)',
  // Tokenization
  'function tokenizeCoffeeGrove(string memory groveName, uint64 tokensPerTree)',
  // Token Purchase (called by investor)
  'function purchaseTreeTokens(string memory groveName, uint64 amount)',
  // Harvest & Revenue
  'function reportHarvest(string memory groveName, uint64 yieldKg, uint64 salePricePerKg)',
  'function distributeRevenue(string memory groveName, uint256 harvestIndex)',
  'function getGroveHarvests(string memory groveName) view returns (tuple(uint64 harvestDate, uint64 yieldKg, uint64 totalRevenue, bool revenueDistributed)[] memory)',
  // Queries
  'function getGroveInfo(string memory groveName) view returns (tuple(string groveName, address farmer, string location, uint64 treeCount, string coffeeVariety, uint64 expectedYieldPerTree, bool isTokenized, address tokenAddress, uint64 totalTokens, uint256 registrationDate))',
  'function getGroveTokenAddress(string memory groveName) view returns (address)',
  'function getAllGroves() view returns (string[] memory)',
  'function getGroveCount() view returns (uint256)',
  // Events
  'event CoffeeGroveRegistered(bytes32 indexed groveNameHash, address indexed farmer, uint64 treeCount)',
  'event CoffeeGroveTokenized(bytes32 indexed groveNameHash, address indexed token, uint64 totalTokens)',
  'event TreeTokensPurchased(address indexed token, uint64 amount, address indexed investor, uint256 totalCost)',
  'event HarvestReported(bytes32 indexed groveNameHash, uint64 yieldKg, uint64 totalRevenue)',
  'event RevenueDistributed(bytes32 indexed groveNameHash, uint64 totalRevenue, uint64 farmerShare, uint64 investorShare)',
];

// CoffeeLendingPool ABI
export const LENDING_POOL_ABI = [
  // Liquidity provision
  'function provideLiquidity(uint256 amount)',
  'function withdrawLiquidity(uint256 lpTokenAmount)',
  
  // Borrowing
  'function takeLoan(address collateralToken, uint256 collateralAmount, uint256 loanAmount)',
  'function repayLoan()',
  
  // Collateral management
  'function addCollateralToken(address _token)',
  'function removeCollateralToken(address _token)',
  'function isCollateralSupported(address token) view returns (bool)',
  'function getSupportedCollateral() view returns (address[] memory)',
  
  // Queries
  'function getLPToken() view returns (address)',
  'function getPoolStats() view returns (uint256 _totalLiquidity, uint256 _availableLiquidity, uint256 _totalBorrowed, uint256 _utilizationRate, uint256 _currentAPY)',
  'function getLoan(address borrower) view returns (address collateralToken, uint256 loanAmount, uint256 collateralAmount, uint256 repayAmount, uint256 borrowDate, bool isActive, bool isLiquidated)',
  'function getLiquidityPosition(address provider) view returns (uint256 amountProvided, uint256 lpTokensReceived, uint256 depositDate, uint256 accruedInterest)',
  'function getCollateralValue(address collateralToken, uint256 collateralAmount) view returns (uint256)',
  'function getMaxLoanAmount(address collateralToken, uint256 collateralAmount) view returns (uint256)',
  
  // Admin
  'function liquidateLoan(address borrower)',
  'function updateAPY(uint256 newAPY)',
  'function setOracle(address _oracle)',
  
  // Public variables
  'function totalLiquidity() view returns (uint256)',
  'function availableLiquidity() view returns (uint256)',
  'function totalBorrowed() view returns (uint256)',
  'function baseAPY() view returns (uint256)',
  'function USDC() view returns (address)',
  'function oracle() view returns (address)',
  'function lpToken() view returns (address)',
  
  // Events
  'event LiquidityProvided(address indexed provider, uint256 amount, uint256 lpTokensReceived, uint256 timestamp)',
  'event LiquidityWithdrawn(address indexed provider, uint256 amount, uint256 lpTokensBurned, uint256 interestEarned, uint256 timestamp)',
  'event LoanTaken(address indexed borrower, uint256 loanAmount, uint256 collateralAmount, uint256 repayAmount, uint256 timestamp)',
  'event LoanRepaid(address indexed borrower, uint256 repayAmount, uint256 timestamp)',
  'event LoanLiquidated(address indexed borrower, uint256 collateralSeized, uint256 timestamp)',
  'event PoolStatsUpdated(uint256 totalLiquidity, uint256 availableLiquidity, uint256 totalBorrowed, uint256 utilizationRate, uint256 timestamp)',
  'event CollateralAdded(address indexed token, uint256 timestamp)',
  'event CollateralRemoved(address indexed token, uint256 timestamp)',
];

// LP Token ABI (ERC20)
export const LP_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

// CoffeeTreeToken ABI (ERC20 for grove tokens)
export const GROVE_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// CoffeeRevenueReserve ABI
export const REVENUE_RESERVE_ABI = [
  'function withdrawFarmerShare(uint256 _amount, address _recipient)',
  'function getFarmerBalance(address _farmer) view returns (uint256)',
  'function farmer() view returns (address)',
  'event FarmerWithdrawal(address indexed farmer, uint256 amount, address recipient)'
];

export default {
  USDC_ABI,
  FARMER_VERIFICATION_ABI,
  PRICE_ORACLE_ABI,
  ISSUER_ABI,
  LENDING_POOL_ABI,
  LP_TOKEN_ABI,
  GROVE_TOKEN_ABI,
  REVENUE_RESERVE_ABI,
};
