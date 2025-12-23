// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CoffeeRevenueReserve
 * @notice Manages revenue distribution for tokenized coffee groves
 * @dev Holds USDC revenue and distributes to token holders
 */
contract CoffeeRevenueReserve {
    
    address public groveToken;
    address public farmer;
    address public usdc;
    
    uint256 public totalDeposited;
    uint256 public totalDistributed;
    
    event RevenueDeposited(uint256 amount, uint256 timestamp);
    event RevenueDistributed(address indexed token, uint256 amount);
    event FarmerShareWithdrawn(address indexed farmer, uint256 amount);
    
    constructor(address _groveToken, address _farmer, address _usdc) {
        groveToken = _groveToken;
        farmer = _farmer;
        usdc = _usdc;
    }
    
    /**
     * @dev Deposit revenue into the reserve
     */
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        totalDeposited += _amount;
        emit RevenueDeposited(_amount, block.timestamp);
    }
    
    /**
     * @dev Distribute revenue to token holders
     */
    function distributeRevenue(address _token, uint256 _amount) external {
        require(_token == groveToken, "Invalid token");
        require(_amount > 0, "Amount must be > 0");
        totalDistributed += _amount;
        emit RevenueDistributed(_token, _amount);
    }
    
    /**
     * @dev Withdraw farmer's share
     */
    function withdrawFarmerShare(uint256 _amount, address _recipient) external {
        require(_recipient == farmer, "Only farmer");
        require(_amount > 0, "Amount must be > 0");
        require(IERC20(usdc).balanceOf(address(this)) >= _amount, "Insufficient balance");
        
        IERC20(usdc).transfer(_recipient, _amount);
        emit FarmerShareWithdrawn(_recipient, _amount);
    }
    
    /**
     * @dev Get reserve balance
     */
    function getBalance() external view returns (uint256) {
        return IERC20(usdc).balanceOf(address(this));
    }
}
