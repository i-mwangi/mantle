// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CoffeeRevenueReserve
 * @notice Manages revenue distribution to token holders
 * @dev Migrated from Hedera - uses standard ERC-20 instead of HTS
 */
contract CoffeeRevenueReserve {
    
    address public groveToken;
    address public farmer;
    address public USDC;
    address public issuer;
    
    uint256 public totalDeposited;
    uint256 public totalDistributed;
    uint256 public distributionCounter;
    
    struct Distribution {
        uint256 distributionId;
        uint256 totalAmount;
        uint256 timestamp;
        bool completed;
    }
    
    mapping(uint256 => Distribution) public distributions;
    mapping(address => uint256) public investorEarnings;
    mapping(address => uint256) public investorWithdrawals;
    
    event RevenueDeposited(
        uint256 amount,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        uint256 indexed distributionId,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event EarningsWithdrawn(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );
    
    event FarmerShareWithdrawn(
        address indexed farmer,
        uint256 amount,
        uint256 timestamp
    );
    
    modifier onlyIssuer() {
        require(msg.sender == issuer, "Only issuer");
        _;
    }
    
    modifier onlyFarmer() {
        require(msg.sender == farmer, "Only farmer");
        _;
    }
    
    constructor(
        address _groveToken,
        address _farmer,
        address _usdc
    ) {
        groveToken = _groveToken;
        farmer = _farmer;
        USDC = _usdc;
        issuer = msg.sender;
    }
    
    /**
     * @dev Deposit revenue to reserve
     */
    function deposit(uint256 _amount) external onlyIssuer {
        require(_amount > 0, "Amount must be positive");
        
        totalDeposited += _amount;
        
        emit RevenueDeposited(_amount, block.timestamp);
    }
    
    /**
     * @dev Distribute revenue to token holders
     */
    function distributeRevenue(
        address _token,
        uint256 _amount
    ) external onlyIssuer {
        require(_token == groveToken, "Invalid token");
        require(_amount > 0, "Amount must be positive");
        require(_amount <= getAvailableBalance(), "Insufficient balance");
        
        distributionCounter++;
        
        distributions[distributionCounter] = Distribution({
            distributionId: distributionCounter,
            totalAmount: _amount,
            timestamp: block.timestamp,
            completed: false
        });
        
        totalDistributed += _amount;
        
        emit RevenueDistributed(distributionCounter, _amount, block.timestamp);
    }
    
    /**
     * @dev Distribute to specific holders (called by issuer)
     */
    function distributeRevenueToHolders(
        uint256 _distributionId,
        address[] memory _holders,
        uint256[] memory _balances
    ) external onlyIssuer {
        require(_holders.length == _balances.length, "Length mismatch");
        
        Distribution storage dist = distributions[_distributionId];
        require(!dist.completed, "Already completed");
        
        uint256 totalSupply = IERC20(groveToken).totalSupply();
        require(totalSupply > 0, "No tokens in circulation");
        
        for (uint256 i = 0; i < _holders.length; i++) {
            if (_balances[i] > 0) {
                uint256 holderShare = (dist.totalAmount * _balances[i]) / totalSupply;
                investorEarnings[_holders[i]] += holderShare;
            }
        }
        
        dist.completed = true;
    }
    
    /**
     * @dev Withdraw farmer share
     */
    function withdrawFarmerShare(
        uint256 _amount,
        address _recipient
    ) external onlyIssuer {
        require(_amount > 0, "Amount must be positive");
        require(_amount <= getAvailableBalance(), "Insufficient balance");
        
        IERC20(USDC).transfer(_recipient, _amount);
        
        emit FarmerShareWithdrawn(_recipient, _amount, block.timestamp);
    }
    
    /**
     * @dev Withdraw earnings (investor)
     */
    function withdrawEarnings(uint256 _amount) external {
        uint256 available = investorEarnings[msg.sender] - investorWithdrawals[msg.sender];
        require(_amount <= available, "Insufficient earnings");
        
        investorWithdrawals[msg.sender] += _amount;
        
        IERC20(USDC).transfer(msg.sender, _amount);
        
        emit EarningsWithdrawn(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Get available balance
     */
    function getAvailableBalance() public view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }
    
    /**
     * @dev Get investor earnings
     */
    function getInvestorEarnings(address _investor) external view returns (
        uint256 totalEarned,
        uint256 totalWithdrawn,
        uint256 available
    ) {
        totalEarned = investorEarnings[_investor];
        totalWithdrawn = investorWithdrawals[_investor];
        available = totalEarned - totalWithdrawn;
    }
    
    /**
     * @dev Refund tokens (for selling back)
     */
    function refund(uint256 _amount, address _recipient) external onlyIssuer {
        require(_amount > 0, "Amount must be positive");
        require(_amount <= getAvailableBalance(), "Insufficient balance");
        
        IERC20(USDC).transfer(_recipient, _amount);
    }
}
