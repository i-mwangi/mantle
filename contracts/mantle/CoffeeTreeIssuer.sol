// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./tokens/CoffeeTreeToken.sol";
import "./CoffeeRevenueReserve.sol";
import "./FarmerVerification.sol";
import "./PriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CoffeeTreeIssuer
 * @notice Main contract for coffee grove tokenization
 * @dev Migrated from Hedera HTS to standard ERC-20
 * 
 * KEY CHANGES FROM HEDERA VERSION:
 * - Removed all HTS imports and calls
 * - Deploy ERC-20 contracts instead of calling createFungibleToken()
 * - Use standard ERC-20 transfer() instead of hts.transferFrom()
 * - Removed HederaResponseCodes checks (ERC-20 reverts automatically)
 * - Removed KYC functionality (can be added as whitelist if needed)
 * - Simplified to single-phase tokenization (no gas limit issues)
 */
contract CoffeeTreeIssuer {
    
    // Structs
    struct CoffeeGrove {
        string groveName;
        address farmer;
        string location;
        uint64 treeCount;
        string coffeeVariety;
        uint64 expectedYieldPerTree;
        bool isTokenized;
        address tokenAddress;
        uint64 totalTokens;
        uint64 tokensPerTree;
        uint256 registrationDate;
    }
    
    struct HarvestRecord {
        uint64 harvestDate;
        uint64 yieldKg;
        uint64 qualityGrade;
        uint64 salePricePerKg;
        uint64 totalRevenue;
        bool revenueDistributed;
    }
    
    // State variables
    address public admin;
    address public USDC;
    PriceOracle public oracle;
    FarmerVerification public farmerVerification;
    
    mapping(string => CoffeeGrove) public coffeeGroves;
    mapping(string => address) public groveTokens;
    mapping(address => CoffeeRevenueReserve) public groveReserves;
    mapping(string => HarvestRecord[]) public groveHarvests;
    
    string[] public registeredGroveNames;
    
    // Events
    event CoffeeGroveRegistered(
        bytes32 indexed groveNameHash,
        address indexed farmer,
        uint64 treeCount,
        string location,
        string coffeeVariety
    );
    
    event CoffeeGroveTokenized(
        bytes32 indexed groveNameHash,
        address indexed token,
        uint64 totalTokens,
        uint64 tokensPerTree
    );
    
    event TreeTokensPurchased(
        address indexed token,
        uint64 indexed amount,
        address indexed investor,
        uint256 totalCost
    );
    
    event HarvestReported(
        bytes32 indexed groveNameHash,
        uint64 yieldKg,
        uint64 totalRevenue,
        uint64 qualityGrade,
        uint256 harvestDate,
        uint256 indexed harvestIndex
    );
    
    event RevenueDistributed(
        bytes32 indexed groveNameHash,
        uint64 totalRevenue,
        uint64 farmerShare,
        uint64 investorShare,
        uint256 timestamp,
        uint256 indexed harvestIndex
    );
    
    // Custom errors
    error UnverifiedFarmer(address farmer);
    error GroveNotFound(string groveName);
    error GroveAlreadyExists(string groveName);
    error GroveNotTokenized(string groveName);
    error InsufficientTokens(uint64 requested, uint256 available);
    error InvalidHarvestData(string reason);
    error RevenueAlreadyDistributed(uint256 harvestIndex);
    error UnauthorizedAccess(address caller);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyVerifiedFarmer() {
        if (!farmerVerification.isVerifiedFarmer(msg.sender)) {
            revert UnverifiedFarmer(msg.sender);
        }
        _;
    }
    
    modifier onlyGroveOwner(string memory groveName) {
        CoffeeGrove memory grove = coffeeGroves[groveName];
        if (grove.farmer == address(0)) {
            revert GroveNotFound(groveName);
        }
        if (grove.farmer != msg.sender) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }
    
    constructor(
        address _farmerVerification,
        address _usdc,
        address _oracle
    ) {
        admin = msg.sender;
        farmerVerification = FarmerVerification(_farmerVerification);
        USDC = _usdc;
        oracle = PriceOracle(_oracle);
    }
    
    /**
     * @dev Register a new coffee grove
     */
    function registerCoffeeGrove(
        string memory _groveName,
        string memory _location,
        uint64 _treeCount,
        string memory _coffeeVariety,
        uint64 _expectedYieldPerTree
    ) external onlyVerifiedFarmer {
        if (coffeeGroves[_groveName].farmer != address(0)) {
            revert GroveAlreadyExists(_groveName);
        }
        
        require(_treeCount > 0, "Tree count must be positive");
        require(_expectedYieldPerTree > 0, "Expected yield must be positive");
        require(bytes(_groveName).length > 0, "Grove name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_coffeeVariety).length > 0, "Coffee variety cannot be empty");
        
        CoffeeGrove storage grove = coffeeGroves[_groveName];
        grove.groveName = _groveName;
        grove.farmer = msg.sender;
        grove.location = _location;
        grove.treeCount = _treeCount;
        grove.coffeeVariety = _coffeeVariety;
        grove.expectedYieldPerTree = _expectedYieldPerTree;
        grove.isTokenized = false;
        grove.registrationDate = block.timestamp;
        
        registeredGroveNames.push(_groveName);
        
        emit CoffeeGroveRegistered(
            keccak256(bytes(_groveName)),
            msg.sender,
            _treeCount,
            _location,
            _coffeeVariety
        );
    }
    
    /**
     * @dev Tokenize a coffee grove (single-phase, no HTS complexity)
     * 
     * MIGRATION NOTE: This replaces the three-step HTS process with a simple
     * ERC-20 contract deployment. Much simpler than Hedera version!
     */
    function tokenizeCoffeeGrove(
        string memory _groveName,
        uint64 _tokensPerTree
    ) external onlyGroveOwner(_groveName) {
        CoffeeGrove storage grove = coffeeGroves[_groveName];
        
        require(!grove.isTokenized, "Grove already tokenized");
        require(_tokensPerTree > 0, "Tokens per tree must be positive");
        
        // Calculate total tokens
        uint64 totalTokens = grove.treeCount * _tokensPerTree;
        
        // Deploy new ERC-20 token contract
        string memory tokenName = string(abi.encodePacked("Coffee Grove: ", _groveName));
        string memory tokenSymbol = string(abi.encodePacked("TREE-", _groveName));
        
        CoffeeTreeToken token = new CoffeeTreeToken(
            tokenName,
            tokenSymbol,
            _groveName,
            grove.location,
            grove.coffeeVariety,
            grove.expectedYieldPerTree
        );
        
        // Mint initial supply to this contract
        token.mint(address(this), totalTokens);
        
        // Create revenue reserve
        CoffeeRevenueReserve reserve = new CoffeeRevenueReserve(
            address(token),
            msg.sender,
            USDC
        );
        
        // Update grove data
        grove.isTokenized = true;
        grove.tokenAddress = address(token);
        grove.totalTokens = totalTokens;
        grove.tokensPerTree = _tokensPerTree;
        
        // Store references
        groveTokens[_groveName] = address(token);
        groveReserves[address(token)] = reserve;
        
        // Set initial token price in oracle
        oracle.setTokenPrice(address(token), 1_000000); // $1.00 per token initially
        
        emit CoffeeGroveTokenized(
            keccak256(bytes(_groveName)),
            address(token),
            totalTokens,
            _tokensPerTree
        );
    }

    
    /**
     * @dev Purchase coffee tree tokens
     * 
     * MIGRATION NOTE: Replaced hts.transferFrom() with standard ERC-20 calls
     */
    function purchaseTreeTokens(
        string memory _groveName,
        uint64 _amount
    ) external {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        
        if (grove.farmer == address(0)) {
            revert GroveNotFound(_groveName);
        }
        if (!grove.isTokenized) {
            revert GroveNotTokenized(_groveName);
        }
        
        address token = grove.tokenAddress;
        CoffeeRevenueReserve reserve = groveReserves[token];
        
        // Check available tokens
        uint256 availableTokens = IERC20(token).balanceOf(address(this));
        if (_amount > availableTokens) {
            revert InsufficientTokens(_amount, availableTokens);
        }
        
        // Get price from oracle
        uint256 pricePerToken = oracle.getPrice(token);
        uint256 totalCost = pricePerToken * _amount;
        
        // Transfer USDC from buyer to reserve (standard ERC-20)
        IERC20(USDC).transferFrom(msg.sender, address(reserve), totalCost);
        
        // Transfer tokens to buyer (standard ERC-20)
        IERC20(token).transfer(msg.sender, _amount);
        
        // Update reserve
        reserve.deposit(totalCost);
        
        emit TreeTokensPurchased(token, _amount, msg.sender, totalCost);
    }
    
    /**
     * @dev Report harvest data
     */
    function reportHarvest(
        string memory _groveName,
        uint64 _yieldKg,
        uint64 _qualityGrade,
        uint64 _salePricePerKg
    ) external onlyGroveOwner(_groveName) {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        
        if (!grove.isTokenized) {
            revert GroveNotTokenized(_groveName);
        }
        
        // Validate harvest data
        require(_yieldKg > 0, "Yield cannot be zero");
        require(_qualityGrade > 0 && _qualityGrade <= 100, "Quality grade must be 1-100");
        require(_salePricePerKg > 0, "Sale price cannot be zero");
        
        uint64 totalRevenue = _yieldKg * _salePricePerKg;
        
        HarvestRecord memory harvest = HarvestRecord({
            harvestDate: uint64(block.timestamp),
            yieldKg: _yieldKg,
            qualityGrade: _qualityGrade,
            salePricePerKg: _salePricePerKg,
            totalRevenue: totalRevenue,
            revenueDistributed: false
        });
        
        groveHarvests[_groveName].push(harvest);
        uint256 harvestIndex = groveHarvests[_groveName].length - 1;
        
        emit HarvestReported(
            keccak256(bytes(_groveName)),
            _yieldKg,
            totalRevenue,
            _qualityGrade,
            block.timestamp,
            harvestIndex
        );
    }
    
    /**
     * @dev Distribute revenue from harvest
     * 
     * MIGRATION NOTE: Simplified from HTS version - uses standard ERC-20 transfers
     */
    function distributeRevenue(
        string memory _groveName,
        uint256 _harvestIndex
    ) external onlyGroveOwner(_groveName) {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        
        if (!grove.isTokenized) {
            revert GroveNotTokenized(_groveName);
        }
        
        HarvestRecord[] storage harvests = groveHarvests[_groveName];
        require(_harvestIndex < harvests.length, "Invalid harvest index");
        
        HarvestRecord storage harvest = harvests[_harvestIndex];
        if (harvest.revenueDistributed) {
            revert RevenueAlreadyDistributed(_harvestIndex);
        }
        
        address token = grove.tokenAddress;
        CoffeeRevenueReserve reserve = groveReserves[token];
        
        // Calculate shares (70% to investors, 30% to farmer)
        uint64 totalRevenue = harvest.totalRevenue;
        uint64 farmerShare = (totalRevenue * 30) / 100;
        uint64 investorShare = totalRevenue - farmerShare;
        
        // Farmer must transfer USDC to reserve first
        IERC20(USDC).transferFrom(msg.sender, address(reserve), totalRevenue);
        reserve.deposit(totalRevenue);
        
        // Distribute to token holders
        reserve.distributeRevenue(token, investorShare);
        
        // Transfer farmer share
        reserve.withdrawFarmerShare(farmerShare, msg.sender);
        
        // Mark as distributed
        harvest.revenueDistributed = true;
        
        emit RevenueDistributed(
            keccak256(bytes(_groveName)),
            totalRevenue,
            farmerShare,
            investorShare,
            block.timestamp,
            _harvestIndex
        );
    }
    
    /**
     * @dev Get grove information
     */
    function getGroveInfo(string memory _groveName) 
        external 
        view 
        returns (CoffeeGrove memory) 
    {
        return coffeeGroves[_groveName];
    }
    
    /**
     * @dev Get grove token address
     */
    function getGroveTokenAddress(string memory _groveName) 
        external 
        view 
        returns (address) 
    {
        return groveTokens[_groveName];
    }
    
    /**
     * @dev Get harvest history
     */
    function getGroveHarvests(string memory _groveName) 
        external 
        view 
        returns (HarvestRecord[] memory) 
    {
        return groveHarvests[_groveName];
    }
    
    /**
     * @dev Get all registered groves
     */
    function getAllGroves() external view returns (string[] memory) {
        return registeredGroveNames;
    }
    
    /**
     * @dev Get grove count
     */
    function getGroveCount() external view returns (uint256) {
        return registeredGroveNames.length;
    }
}
