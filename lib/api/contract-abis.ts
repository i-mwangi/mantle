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
  'function tokenizeGrove(string memory groveName, string memory location, uint256 numberOfTrees, uint256 tokensPerTree) returns (address)',
  'function getGroveToken(uint256 groveId) view returns (address)',
  'function getGroveCount() view returns (uint256)',
  'function getGroveInfo(uint256 groveId) view returns (string memory name, string memory location, uint256 trees, address tokenAddress, address farmer)',
  'event GroveTokenized(uint256 indexed groveId, address indexed farmer, address tokenAddress, uint256 totalSupply)',
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
