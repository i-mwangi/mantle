// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing
 * @dev Use real USDC address on mainnet
 */
contract MockUSDC is ERC20 {
    
    constructor() ERC20("USD Coin", "USDC") {
        // Mint 1 million USDC for testing
        _mint(msg.sender, 1_000_000 * 10**6);
    }
    
    /**
     * @dev USDC uses 6 decimals
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Mint function for testing (remove in production)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
