// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/**
 * @title FarmerVerification
 * @notice Manages farmer verification and KYC
 * @dev Migrated from Hedera - removed HTS-specific features
 */
contract FarmerVerification {
    
    address public admin;
    
    struct FarmerProfile {
        address farmerAddress;
        string name;
        string location;
        string contactInfo;
        bool isVerified;
        uint256 verificationDate;
        string verificationDocumentHash;
    }
    
    mapping(address => FarmerProfile) public farmers;
    address[] public verifiedFarmers;
    
    event FarmerRegistered(
        address indexed farmer,
        string name,
        string location,
        uint256 timestamp
    );
    
    event FarmerVerified(
        address indexed farmer,
        string documentHash,
        uint256 timestamp
    );
    
    event FarmerRevoked(
        address indexed farmer,
        uint256 timestamp
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Register as a farmer
     */
    function registerFarmer(
        string memory _name,
        string memory _location,
        string memory _contactInfo
    ) external {
        require(farmers[msg.sender].farmerAddress == address(0), "Already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_location).length > 0, "Location required");
        
        farmers[msg.sender] = FarmerProfile({
            farmerAddress: msg.sender,
            name: _name,
            location: _location,
            contactInfo: _contactInfo,
            isVerified: false,
            verificationDate: 0,
            verificationDocumentHash: ""
        });
        
        emit FarmerRegistered(msg.sender, _name, _location, block.timestamp);
    }
    
    /**
     * @dev Verify a farmer (admin only)
     */
    function verifyFarmer(
        address _farmer,
        string memory _documentHash
    ) external onlyAdmin {
        require(farmers[_farmer].farmerAddress != address(0), "Farmer not registered");
        require(!farmers[_farmer].isVerified, "Already verified");
        
        farmers[_farmer].isVerified = true;
        farmers[_farmer].verificationDate = block.timestamp;
        farmers[_farmer].verificationDocumentHash = _documentHash;
        
        verifiedFarmers.push(_farmer);
        
        emit FarmerVerified(_farmer, _documentHash, block.timestamp);
    }
    
    /**
     * @dev Revoke farmer verification
     */
    function revokeFarmer(address _farmer) external onlyAdmin {
        require(farmers[_farmer].isVerified, "Not verified");
        
        farmers[_farmer].isVerified = false;
        
        emit FarmerRevoked(_farmer, block.timestamp);
    }
    
    /**
     * @dev Check if farmer is verified
     */
    function isVerifiedFarmer(address _farmer) external view returns (bool) {
        return farmers[_farmer].isVerified;
    }
    
    /**
     * @dev Get farmer profile
     */
    function getFarmerProfile(address _farmer) external view returns (FarmerProfile memory) {
        return farmers[_farmer];
    }
    
    /**
     * @dev Get all verified farmers
     */
    function getVerifiedFarmers() external view returns (address[] memory) {
        return verifiedFarmers;
    }
}
