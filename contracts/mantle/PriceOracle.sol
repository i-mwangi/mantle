// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/**
 * @title PriceOracle
 * @notice Manages coffee and token prices
 * @dev Migrated from Hedera - simplified for EVM
 */
contract PriceOracle {
    
    address public admin;
    
    // Token address => price in USDC (6 decimals)
    mapping(address => uint256) public tokenPrices;
    
    // Coffee variety => price per kg in USDC (6 decimals)
    mapping(string => uint256) public coffeePrices;
    
    event TokenPriceUpdated(
        address indexed token,
        uint256 newPrice,
        uint256 timestamp
    );
    
    event CoffeePriceUpdated(
        string indexed variety,
        uint256 newPrice,
        uint256 timestamp
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        
        // Set default coffee prices (per kg in USDC, 6 decimals)
        coffeePrices["Arabica"] = 5_000000; // $5.00
        coffeePrices["Robusta"] = 3_000000; // $3.00
        coffeePrices["Liberica"] = 7_000000; // $7.00
    }
    
    /**
     * @dev Set token price
     */
    function setTokenPrice(address _token, uint256 _price) external onlyAdmin {
        require(_token != address(0), "Invalid token");
        require(_price > 0, "Price must be positive");
        
        tokenPrices[_token] = _price;
        emit TokenPriceUpdated(_token, _price, block.timestamp);
    }
    
    /**
     * @dev Set coffee price
     */
    function setCoffeePrice(string memory _variety, uint256 _price) external onlyAdmin {
        require(bytes(_variety).length > 0, "Invalid variety");
        require(_price > 0, "Price must be positive");
        
        coffeePrices[_variety] = _price;
        emit CoffeePriceUpdated(_variety, _price, block.timestamp);
    }
    
    /**
     * @dev Get token price
     */
    function getPrice(address _token) external view returns (uint256) {
        uint256 price = tokenPrices[_token];
        require(price > 0, "Price not set");
        return price;
    }
    
    /**
     * @dev Get coffee price
     */
    function getCoffeePrice(string memory _variety) external view returns (uint256) {
        uint256 price = coffeePrices[_variety];
        require(price > 0, "Price not set");
        return price;
    }
    
    /**
     * @dev Batch update token prices
     */
    function batchSetTokenPrices(
        address[] memory _tokens,
        uint256[] memory _prices
    ) external onlyAdmin {
        require(_tokens.length == _prices.length, "Length mismatch");
        
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "Invalid token");
            require(_prices[i] > 0, "Price must be positive");
            
            tokenPrices[_tokens[i]] = _prices[i];
            emit TokenPriceUpdated(_tokens[i], _prices[i], block.timestamp);
        }
    }
}
