/**
 * Mantle Network Configuration
 * Contract addresses and network settings
 */

// Network configurations
export const NETWORKS = {
  LOCALHOST: {
    chainId: 31337,
    name: 'Localhost 8545',
    rpcUrl: 'http://127.0.0.1:8545',
    symbol: 'ETH'
  },
  MANTLE_SEPOLIA: {
    chainId: 5003,
    name: 'Mantle Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    symbol: 'MNT',
    explorer: 'https://sepolia.mantlescan.xyz'
  }
};

// Contract addresses (from .env or deployment)
export const CONTRACTS = {
  USDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  FARMER_VERIFICATION: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  PRICE_ORACLE: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  ISSUER: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  LENDING_POOL: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  LP_TOKEN: '0x61c36a8d610163660E21a8b7359e1Cac0C9133e1'
};

// Get contract address by name
export function getContractAddress(name) {
  return CONTRACTS[name.toUpperCase()];
}

// Get current network config
export function getCurrentNetwork() {
  // Default to localhost for development
  return NETWORKS.LOCALHOST;
}

export default {
  NETWORKS,
  CONTRACTS,
  getContractAddress,
  getCurrentNetwork
};
