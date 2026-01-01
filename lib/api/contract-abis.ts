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
  'event HarvestReported(bytes32 indexed groveNameHash, uint64 yieldKg, uint64 totalRevenue)',
  'event RevenueDistributed(bytes32 indexed groveNameHash, uint64 totalRevenue, uint64 farmerShare, uint64 investorShare)',
];

// CoffeeLendingPool ABI
export const LENDING_POOL_ABI = [
  'function deposit(uint256 amount)',
  'function withdraw(uint256 amount)',
  'function borrow(address collateralToken, uint256 collateralAmount, uint256 borrowAmount)',
  'function repay(uint256 loanId, uint256 amount)',
  'function getLPToken() view returns (address)',
  'function getUserDeposit(address user) view returns (uint256)',
  'function getLoan(uint256 loanId) view returns (address borrower, uint256 collateralAmount, uint256 borrowedAmount, uint256 interestRate, bool active)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event Borrowed(address indexed borrower, uint256 loanId, uint256 amount)',
  'event Repaid(address indexed borrower, uint256 loanId, uint256 amount)',
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
};
