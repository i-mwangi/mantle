// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoffeeTreeToken
 * @notice ERC-20 token representing ownership in a coffee grove
 * @dev Migrated from Hedera HTS to standard ERC-20
 */
contract CoffeeTreeToken is ERC20, Ownable {
    
    // Grove metadata
    string public groveName;
    string public location;
    string public coffeeVariety;
    uint64 public expectedYieldPerSeason;
    uint64 public plantingDate;
    uint8 public currentHealthScore;
    string public farmingPractices;
    uint256 public lastHealthUpdate;
    
    // Health monitoring
    struct HealthUpdate {
        uint256 updateDate;
        uint8 healthScore;
        string notes;
        address updatedBy;
    }
    
    HealthUpdate[] public healthHistory;
    
    // Events
    event TreeHealthUpdated(
        uint8 indexed newHealthScore,
        string notes,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event TreeMetadataUpdated(
        string field,
        string newValue,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event FarmingPracticesUpdated(
        string newPractices,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _groveName,
        string memory _location,
        string memory _coffeeVariety,
        uint64 _expectedYield
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        groveName = _groveName;
        location = _location;
        coffeeVariety = _coffeeVariety;
        expectedYieldPerSeason = _expectedYield;
        plantingDate = uint64(block.timestamp);
        currentHealthScore = 100; // Start with perfect health
        farmingPractices = "Organic farming practices";
        lastHealthUpdate = block.timestamp;
    }
    
    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Update tree health score
     */
    function updateTreeHealth(uint8 _healthScore, string memory _notes) external onlyOwner {
        require(_healthScore <= 100, "Health score must be 0-100");
        require(bytes(_notes).length > 0, "Notes cannot be empty");
        
        currentHealthScore = _healthScore;
        lastHealthUpdate = block.timestamp;
        
        healthHistory.push(HealthUpdate({
            updateDate: block.timestamp,
            healthScore: _healthScore,
            notes: _notes,
            updatedBy: msg.sender
        }));
        
        emit TreeHealthUpdated(_healthScore, _notes, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update farming practices
     */
    function updateFarmingPractices(string memory _newPractices) external onlyOwner {
        require(bytes(_newPractices).length > 0, "Farming practices cannot be empty");
        farmingPractices = _newPractices;
        emit FarmingPracticesUpdated(_newPractices, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update expected yield
     */
    function updateExpectedYield(uint64 _newExpectedYield) external onlyOwner {
        require(_newExpectedYield > 0, "Expected yield must be positive");
        expectedYieldPerSeason = _newExpectedYield;
        emit TreeMetadataUpdated("expectedYieldPerSeason", "", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get health history
     */
    function getHealthHistory() external view returns (HealthUpdate[] memory) {
        return healthHistory;
    }
    
    /**
     * @dev Get latest health update
     */
    function getLatestHealthUpdate() external view returns (HealthUpdate memory) {
        require(healthHistory.length > 0, "No health updates available");
        return healthHistory[healthHistory.length - 1];
    }
    
    /**
     * @dev Calculate health-adjusted yield projection
     */
    function getHealthAdjustedYieldProjection() external view returns (uint64) {
        return (expectedYieldPerSeason * currentHealthScore) / 100;
    }
    
    /**
     * @dev Check if trees need attention
     */
    function needsAttention() external view returns (bool) {
        return currentHealthScore < 70;
    }
    
    /**
     * @dev Get days since last health update
     */
    function daysSinceLastHealthUpdate() external view returns (uint256) {
        if (lastHealthUpdate == 0) return 0;
        return (block.timestamp - lastHealthUpdate) / 86400;
    }
}
