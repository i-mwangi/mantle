// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LPToken
 * @notice Liquidity Provider token for the lending pool
 * @dev Standard ERC-20 token with mint/burn controlled by lending pool
 */
contract LPToken is ERC20, Ownable {
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}
    
    /**
     * @dev Mint LP tokens (only lending pool)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn LP tokens (only lending pool)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
    
    /**
     * @dev Returns 6 decimals to match USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
