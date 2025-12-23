// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./tokens/L2CoffeeTreeToken.sol";
import "./CoffeeRevenueReserve.sol";
import "./FarmerVerification.sol";
import "./PriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CoffeeTreeIssuerSimple
 * @notice Simplified version of CoffeeTreeIssuer to reduce contract size
 * @dev Core functionality only - removed advanced features
 */
contract CoffeeTreeIssuerSimple {
    
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
        uint256 registrationDate;
    }
    
    struct HarvestRecord {
        uint64 harvestDate;
        uint64 yieldKg;
        uint64 totalRevenue;
        bool revenueDistributed;
    }
    
    address public admin;
    address public USDC;
    PriceOracle public oracle;
    FarmerVerification public farmerVerification;
    address public lendingPool; // Optional lending pool integration
    
    mapping(string => CoffeeGrove) public coffeeGroves;
    mapping(string => address) public groveTokens;
    mapping(address => CoffeeRevenueReserve) public groveReserves;
    mapping(string => HarvestRecord[]) public groveHarvests;
    
    string[] public registeredGroveNames;
    
    event CoffeeGroveRegistered(bytes32 indexed groveNameHash, address indexed farmer, uint64 treeCount);
    event CoffeeGroveTokenized(bytes32 indexed groveNameHash, address indexed token, uint64 totalTokens);
    event TreeTokensPurchased(address indexed token, uint64 amount, address indexed investor, uint256 totalCost);
    event HarvestReported(bytes32 indexed groveNameHash, uint64 yieldKg, uint64 totalRevenue);
    event RevenueDistributed(bytes32 indexed groveNameHash, uint64 totalRevenue, uint64 farmerShare, uint64 investorShare);
    
    error UnverifiedFarmer(address farmer);
    error GroveNotFound(string groveName);
    error GroveAlreadyExists(string groveName);
    error GroveNotTokenized(string groveName);
    error InsufficientTokens(uint64 requested, uint256 available);
    error UnauthorizedAccess(address caller);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyGroveOwner(string memory groveName) {
        CoffeeGrove memory grove = coffeeGroves[groveName];
        if (grove.farmer == address(0)) revert GroveNotFound(groveName);
        if (grove.farmer != msg.sender) revert UnauthorizedAccess(msg.sender);
        _;
    }
    
    constructor(address _farmerVerification, address _usdc, address _oracle) {
        admin = msg.sender;
        farmerVerification = FarmerVerification(_farmerVerification);
        USDC = _usdc;
        oracle = PriceOracle(_oracle);
    }
    
    /**
     * @dev Set lending pool address (for collateral integration)
     */
    function setLendingPool(address _lendingPool) external onlyAdmin {
        require(_lendingPool != address(0), "Invalid lending pool address");
        lendingPool = _lendingPool;
    }
    
    function registerCoffeeGrove(
        string memory _groveName,
        string memory _location,
        uint64 _treeCount,
        string memory _coffeeVariety,
        uint64 _expectedYieldPerTree
    ) external {
        if (coffeeGroves[_groveName].farmer != address(0)) revert GroveAlreadyExists(_groveName);
        require(_treeCount > 0 && _expectedYieldPerTree > 0, "Invalid parameters");
        
        CoffeeGrove storage grove = coffeeGroves[_groveName];
        grove.groveName = _groveName;
        grove.farmer = msg.sender;
        grove.location = _location;
        grove.treeCount = _treeCount;
        grove.coffeeVariety = _coffeeVariety;
        grove.expectedYieldPerTree = _expectedYieldPerTree;
        grove.registrationDate = block.timestamp;
        
        registeredGroveNames.push(_groveName);
        
        emit CoffeeGroveRegistered(keccak256(bytes(_groveName)), msg.sender, _treeCount);
    }
    
    function tokenizeCoffeeGrove(string memory _groveName, uint64 _tokensPerTree) external onlyGroveOwner(_groveName) {
        CoffeeGrove storage grove = coffeeGroves[_groveName];
        require(!grove.isTokenized, "Already tokenized");
        require(_tokensPerTree > 0, "Invalid tokens per tree");
        
        uint64 totalTokens = grove.treeCount * _tokensPerTree;
        
        // Use this contract as the L2 Bridge for minting purposes
        // In production, this would be the actual Mantle L2 Standard Bridge
        address l2Bridge = address(this);
        
        L2CoffeeTreeToken token = new L2CoffeeTreeToken(
            l2Bridge,
            address(0), // L1 token address (not used for now)
            string(abi.encodePacked("Coffee Grove: ", _groveName)),
            string(abi.encodePacked("TREE-", _groveName)),
            _groveName,
            grove.location,
            grove.coffeeVariety,
            grove.expectedYieldPerTree
        );
        
        // Mint tokens to this contract (issuer holds tokens for sale)
        token.mint(address(this), totalTokens);
        
        CoffeeRevenueReserve reserve = new CoffeeRevenueReserve(address(token), msg.sender, USDC);
        
        grove.isTokenized = true;
        grove.tokenAddress = address(token);
        grove.totalTokens = totalTokens;
        groveTokens[_groveName] = address(token);
        groveReserves[address(token)] = reserve;
        
        // Note: Price should be set by admin via oracle.setTokenPrice()
        
        emit CoffeeGroveTokenized(keccak256(bytes(_groveName)), address(token), totalTokens);
    }
    
    function purchaseTreeTokens(string memory _groveName, uint64 _amount) external {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        if (grove.farmer == address(0)) revert GroveNotFound(_groveName);
        if (!grove.isTokenized) revert GroveNotTokenized(_groveName);
        
        address token = grove.tokenAddress;
        uint256 availableTokens = IERC20(token).balanceOf(address(this));
        if (_amount > availableTokens) revert InsufficientTokens(_amount, availableTokens);
        
        uint256 pricePerToken = oracle.getPrice(token);
        uint256 totalCost = pricePerToken * _amount;
        
        IERC20(USDC).transferFrom(msg.sender, address(groveReserves[token]), totalCost);
        IERC20(token).transfer(msg.sender, _amount);
        groveReserves[token].deposit(totalCost);
        
        emit TreeTokensPurchased(token, _amount, msg.sender, totalCost);
    }
    
    function reportHarvest(string memory _groveName, uint64 _yieldKg, uint64 _salePricePerKg) 
        external onlyGroveOwner(_groveName) 
    {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        if (!grove.isTokenized) revert GroveNotTokenized(_groveName);
        require(_yieldKg > 0 && _salePricePerKg > 0, "Invalid harvest data");
        
        uint64 totalRevenue = _yieldKg * _salePricePerKg;
        groveHarvests[_groveName].push(HarvestRecord({
            harvestDate: uint64(block.timestamp),
            yieldKg: _yieldKg,
            totalRevenue: totalRevenue,
            revenueDistributed: false
        }));
        
        emit HarvestReported(keccak256(bytes(_groveName)), _yieldKg, totalRevenue);
    }
    
    function distributeRevenue(string memory _groveName, uint256 _harvestIndex) 
        external onlyGroveOwner(_groveName) 
    {
        CoffeeGrove memory grove = coffeeGroves[_groveName];
        if (!grove.isTokenized) revert GroveNotTokenized(_groveName);
        
        HarvestRecord[] storage harvests = groveHarvests[_groveName];
        require(_harvestIndex < harvests.length, "Invalid harvest index");
        
        HarvestRecord storage harvest = harvests[_harvestIndex];
        require(!harvest.revenueDistributed, "Already distributed");
        
        uint64 totalRevenue = harvest.totalRevenue;
        uint64 farmerShare = (totalRevenue * 30) / 100;
        uint64 investorShare = totalRevenue - farmerShare;
        
        IERC20(USDC).transferFrom(msg.sender, address(groveReserves[grove.tokenAddress]), totalRevenue);
        groveReserves[grove.tokenAddress].deposit(totalRevenue);
        groveReserves[grove.tokenAddress].distributeRevenue(grove.tokenAddress, investorShare);
        groveReserves[grove.tokenAddress].withdrawFarmerShare(farmerShare, msg.sender);
        
        harvest.revenueDistributed = true;
        
        emit RevenueDistributed(keccak256(bytes(_groveName)), totalRevenue, farmerShare, investorShare);
    }
    
    function getGroveInfo(string memory _groveName) external view returns (CoffeeGrove memory) {
        return coffeeGroves[_groveName];
    }
    
    function getGroveTokenAddress(string memory _groveName) external view returns (address) {
        return groveTokens[_groveName];
    }
    
    function getGroveHarvests(string memory _groveName) external view returns (HarvestRecord[] memory) {
        return groveHarvests[_groveName];
    }
    
    function getAllGroves() external view returns (string[] memory) {
        return registeredGroveNames;
    }
    
    function getGroveCount() external view returns (uint256) {
        return registeredGroveNames.length;
    }
}
