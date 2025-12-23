// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./tokens/LPToken.sol";
import "./PriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoffeeLendingPool {
    
    address public admin;
    address public USDC;
    PriceOracle public oracle;
    LPToken public lpToken;
    
    uint256 public totalLiquidity;
    uint256 public availableLiquidity;
    uint256 public totalBorrowed;
    uint256 public baseAPY = 850; // 8.5% (in basis points)
    
    uint256 public constant COLLATERALIZATION_RATIO = 125; // 125%
    uint256 public constant LIQUIDATION_THRESHOLD = 90; // 90%
    uint256 public constant INTEREST_RATE = 10; // 10%
    
    // Supported collateral tokens (coffee tree tokens)
    mapping(address => bool) public supportedCollateral;
    address[] public collateralTokens;
    
    struct Loan {
        address borrower;
        address collateralToken;
        uint256 loanAmountUSDC;
        uint256 collateralAmount;
        uint256 liquidationPrice;
        uint256 repayAmountUSDC;
        uint256 borrowDate;
        bool isActive;
        bool isLiquidated;
    }
    
    struct LiquidityPosition {
        address provider;
        uint256 amountProvided;
        uint256 lpTokensReceived;
        uint256 depositDate;
        uint256 accruedInterest;
    }
    
    mapping(address => Loan) public loans;
    mapping(address => LiquidityPosition) public liquidityPositions;
    
    address[] public liquidityProviders;
    address[] public activeBorrowers;
    
    event LiquidityProvided(
        address indexed provider,
        uint256 amount,
        uint256 lpTokensReceived,
        uint256 timestamp
    );
    
    event LiquidityWithdrawn(
        address indexed provider,
        uint256 amount,
        uint256 lpTokensBurned,
        uint256 interestEarned,
        uint256 timestamp
    );
    
    event LoanTaken(
        address indexed borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 repayAmount,
        uint256 timestamp
    );
    
    event LoanRepaid(
        address indexed borrower,
        uint256 repayAmount,
        uint256 timestamp
    );
    
    event LoanLiquidated(
        address indexed borrower,
        uint256 collateralSeized,
        uint256 timestamp
    );
    
    event PoolStatsUpdated(
        uint256 totalLiquidity,
        uint256 availableLiquidity,
        uint256 totalBorrowed,
        uint256 utilizationRate,
        uint256 timestamp
    );
    
    event CollateralAdded(address indexed token, uint256 timestamp);
    event CollateralRemoved(address indexed token, uint256 timestamp);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    constructor(address _usdcToken, address _oracle) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_oracle != address(0), "Invalid oracle address");
        
        admin = msg.sender;
        USDC = _usdcToken;
        oracle = PriceOracle(_oracle);
        
        // Create LP token immediately
        lpToken = new LPToken("Coffee Lending Pool LP", "CLP-LP");
    }
    
    /**
     * @dev Set oracle address (admin only)
     */
    function setOracle(address _oracle) external onlyAdmin {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = PriceOracle(_oracle);
    }
    
    /**
     * @dev Add a coffee tree token as supported collateral
     */
    function addCollateralToken(address _token) external onlyAdmin {
        require(_token != address(0), "Invalid token address");
        require(!supportedCollateral[_token], "Token already supported");
        
        supportedCollateral[_token] = true;
        collateralTokens.push(_token);
        
        emit CollateralAdded(_token, block.timestamp);
    }
    
    /**
     * @dev Remove a coffee tree token from supported collateral
     */
    function removeCollateralToken(address _token) external onlyAdmin {
        require(supportedCollateral[_token], "Token not supported");
        
        supportedCollateral[_token] = false;
        
        emit CollateralRemoved(_token, block.timestamp);
    }
    
    /**
     * @dev Provide liquidity to the pool
     * 
     * MIGRATION NOTE: Uses standard ERC-20 transferFrom instead of HTS
     */
    function provideLiquidity(uint256 amount) external {
        require(address(lpToken) != address(0), "LP token not created");
        require(amount > 0, "Amount must be positive");
        
        // Transfer USDC from provider to pool (standard ERC-20)
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        
        // Calculate LP tokens to mint
        uint256 lpTokensToMint = amount;
        if (totalLiquidity > 0) {
            lpTokensToMint = (amount * lpToken.totalSupply()) / totalLiquidity;
        }
        
        // Mint LP tokens to provider
        lpToken.mint(msg.sender, lpTokensToMint);
        
        // Update position
        if (liquidityPositions[msg.sender].provider == address(0)) {
            liquidityProviders.push(msg.sender);
        }
        
        liquidityPositions[msg.sender].provider = msg.sender;
        liquidityPositions[msg.sender].amountProvided += amount;
        liquidityPositions[msg.sender].lpTokensReceived += lpTokensToMint;
        liquidityPositions[msg.sender].depositDate = block.timestamp;
        
        totalLiquidity += amount;
        availableLiquidity += amount;
        
        emit LiquidityProvided(msg.sender, amount, lpTokensToMint, block.timestamp);
        _updatePoolStats();
    }
    
    /**
     * @dev Withdraw liquidity from the pool
     */
    function withdrawLiquidity(uint256 lpTokenAmount) external {
        require(lpTokenAmount > 0, "Amount must be positive");
        require(lpToken.balanceOf(msg.sender) >= lpTokenAmount, "Insufficient LP tokens");
        
        uint256 lpTotalSupply = lpToken.totalSupply();
        uint256 usdcAmount = (lpTokenAmount * totalLiquidity) / lpTotalSupply;
        
        require(usdcAmount <= availableLiquidity, "Insufficient liquidity available");
        
        // Burn LP tokens
        lpToken.burn(msg.sender, lpTokenAmount);
        
        // Transfer USDC to provider
        IERC20(USDC).transfer(msg.sender, usdcAmount);
        
        uint256 interest = liquidityPositions[msg.sender].accruedInterest;
        
        liquidityPositions[msg.sender].amountProvided -= usdcAmount;
        liquidityPositions[msg.sender].lpTokensReceived -= lpTokenAmount;
        liquidityPositions[msg.sender].accruedInterest = 0;
        
        totalLiquidity -= usdcAmount;
        availableLiquidity -= usdcAmount;
        
        emit LiquidityWithdrawn(msg.sender, usdcAmount, lpTokenAmount, interest, block.timestamp);
        _updatePoolStats();
    }
    
    /**
     * @dev Take out a loan using coffee tree tokens as collateral
     */
    function takeLoan(address collateralToken, uint256 collateralAmount, uint256 loanAmount) external {
        require(supportedCollateral[collateralToken], "Collateral token not supported");
        require(collateralAmount > 0, "Collateral must be positive");
        require(loanAmount > 0, "Loan amount must be positive");
        require(!loans[msg.sender].isActive, "Existing loan must be repaid first");
        require(loanAmount <= availableLiquidity, "Insufficient pool liquidity");
        
        // Get token price from oracle (price per token in USDC with 6 decimals)
        uint256 tokenPrice = oracle.getPrice(collateralToken);
        require(tokenPrice > 0, "Token price not set");
        
        // Calculate collateral value in USDC
        // collateralAmount is in token units (no decimals for coffee tree tokens)
        // tokenPrice is in USDC (6 decimals), so result is already in USDC with 6 decimals
        uint256 collateralValueUSDC = collateralAmount * tokenPrice;
        
        // Calculate required collateral value (125% of loan amount)
        uint256 requiredCollateralValue = (loanAmount * COLLATERALIZATION_RATIO) / 100;
        require(collateralValueUSDC >= requiredCollateralValue, "Insufficient collateral");
        
        // Transfer collateral from borrower to pool
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        
        uint256 liquidationPrice = (loanAmount * LIQUIDATION_THRESHOLD) / 100;
        uint256 repayAmount = (loanAmount * (100 + INTEREST_RATE)) / 100;
        
        loans[msg.sender] = Loan({
            borrower: msg.sender,
            collateralToken: collateralToken,
            loanAmountUSDC: loanAmount,
            collateralAmount: collateralAmount,
            liquidationPrice: liquidationPrice,
            repayAmountUSDC: repayAmount,
            borrowDate: block.timestamp,
            isActive: true,
            isLiquidated: false
        });
        
        activeBorrowers.push(msg.sender);
        
        // Transfer loan amount to borrower
        IERC20(USDC).transfer(msg.sender, loanAmount);
        
        availableLiquidity -= loanAmount;
        totalBorrowed += loanAmount;
        
        emit LoanTaken(msg.sender, loanAmount, collateralAmount, repayAmount, block.timestamp);
        _updatePoolStats();
    }
    
    /**
     * @dev Calculate collateral value in USDC
     */
    function getCollateralValue(address collateralToken, uint256 collateralAmount) public view returns (uint256) {
        uint256 tokenPrice = oracle.getPrice(collateralToken);
        return collateralAmount * tokenPrice;
    }
    
    /**
     * @dev Calculate maximum loan amount for given collateral
     */
    function getMaxLoanAmount(address collateralToken, uint256 collateralAmount) public view returns (uint256) {
        uint256 collateralValue = getCollateralValue(collateralToken, collateralAmount);
        return (collateralValue * 100) / COLLATERALIZATION_RATIO;
    }
    
    /**
     * @dev Repay loan and get collateral back
     */
    function repayLoan() external {
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "No active loan");
        require(!loan.isLiquidated, "Loan already liquidated");
        
        // Transfer repayment from borrower to pool
        IERC20(USDC).transferFrom(msg.sender, address(this), loan.repayAmountUSDC);
        
        // Return collateral to borrower
        IERC20(loan.collateralToken).transfer(msg.sender, loan.collateralAmount);
        
        uint256 interest = loan.repayAmountUSDC - loan.loanAmountUSDC;
        
        availableLiquidity += loan.repayAmountUSDC;
        totalBorrowed -= loan.loanAmountUSDC;
        
        emit LoanRepaid(msg.sender, loan.repayAmountUSDC, block.timestamp);
        
        loan.isActive = false;
        
        _distributeInterestToProviders(interest);
        _updatePoolStats();
    }
    
    /**
     * @dev Liquidate undercollateralized loan
     */
    function liquidateLoan(address borrower) external onlyAdmin {
        Loan storage loan = loans[borrower];
        require(loan.isActive, "No active loan");
        require(!loan.isLiquidated, "Already liquidated");
        
        loan.isActive = false;
        loan.isLiquidated = true;
        
        emit LoanLiquidated(borrower, loan.collateralAmount, block.timestamp);
        _updatePoolStats();
    }
    
    /**
     * @dev Distribute interest to liquidity providers
     */
    function _distributeInterestToProviders(uint256 interestAmount) internal {
        if (liquidityProviders.length == 0 || totalLiquidity == 0) {
            return;
        }
        
        for (uint256 i = 0; i < liquidityProviders.length; i++) {
            address provider = liquidityProviders[i];
            LiquidityPosition storage position = liquidityPositions[provider];
            
            if (position.amountProvided > 0) {
                uint256 share = (position.amountProvided * interestAmount) / totalLiquidity;
                position.accruedInterest += share;
            }
        }
    }
    
    /**
     * @dev Update pool statistics
     */
    function _updatePoolStats() internal {
        uint256 utilizationRate = totalLiquidity > 0 
            ? (totalBorrowed * 10000) / totalLiquidity 
            : 0;
        
        emit PoolStatsUpdated(
            totalLiquidity,
            availableLiquidity,
            totalBorrowed,
            utilizationRate,
            block.timestamp
        );
    }
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalLiquidity,
        uint256 _availableLiquidity,
        uint256 _totalBorrowed,
        uint256 _utilizationRate,
        uint256 _currentAPY
    ) {
        uint256 utilizationRate = totalLiquidity > 0 
            ? (totalBorrowed * 10000) / totalLiquidity 
            : 0;
        
        return (
            totalLiquidity,
            availableLiquidity,
            totalBorrowed,
            utilizationRate,
            baseAPY
        );
    }
    
    /**
     * @dev Get loan details
     */
    function getLoan(address borrower) external view returns (
        address collateralToken,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 repayAmount,
        uint256 borrowDate,
        bool isActive,
        bool isLiquidated
    ) {
        Loan memory loan = loans[borrower];
        return (
            loan.collateralToken,
            loan.loanAmountUSDC,
            loan.collateralAmount,
            loan.repayAmountUSDC,
            loan.borrowDate,
            loan.isActive,
            loan.isLiquidated
        );
    }
    
    /**
     * @dev Get all supported collateral tokens
     */
    function getSupportedCollateral() external view returns (address[] memory) {
        return collateralTokens;
    }
    
    /**
     * @dev Check if a token is supported as collateral
     */
    function isCollateralSupported(address token) external view returns (bool) {
        return supportedCollateral[token];
    }
    
    /**
     * @dev Get liquidity position
     */
    function getLiquidityPosition(address provider) external view returns (
        uint256 amountProvided,
        uint256 lpTokensReceived,
        uint256 depositDate,
        uint256 accruedInterest
    ) {
        LiquidityPosition memory position = liquidityPositions[provider];
        return (
            position.amountProvided,
            position.lpTokensReceived,
            position.depositDate,
            position.accruedInterest
        );
    }
    
    /**
     * @dev Update APY
     */
    function updateAPY(uint256 newAPY) external onlyAdmin {
        require(newAPY <= 10000, "APY cannot exceed 100%");
        baseAPY = newAPY;
    }
    
    /**
     * @dev Get LP token address
     */
    function getLPToken() external view returns (address) {
        return address(lpToken);
    }
}
