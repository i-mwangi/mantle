/**
 * Mantle Contract Service
 * Replaces Hedera SDK with ethers.js for contract interactions
 */

import { ethers } from 'ethers';
import { getEnv } from '../utils.js';

// Contract addresses from environment
const CONTRACTS = {
  USDC: process.env.MANTLE_USDC_ADDRESS,
  FARMER_VERIFICATION: process.env.MANTLE_FARMER_VERIFICATION_ADDRESS,
  PRICE_ORACLE: process.env.MANTLE_PRICE_ORACLE_ADDRESS,
  ISSUER: process.env.MANTLE_ISSUER_ADDRESS,
  LENDING_POOL: process.env.MANTLE_LENDING_POOL_ADDRESS,
  LP_TOKEN: process.env.MANTLE_LP_TOKEN_ADDRESS,
};

// Network configuration
const NETWORK_CONFIG = {
  localhost: {
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
  },
  mantleSepolia: {
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    chainId: 5003,
  },
};

export class MantleContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private network: 'localhost' | 'mantleSepolia';

  constructor(network: 'localhost' | 'mantleSepolia' = 'localhost') {
    this.network = network;
    const config = NETWORK_CONFIG[network];
    
    // Create provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Create signer from private key
    const privateKey = getEnv('PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    console.log(`✅ Mantle service initialized on ${network}`);
    console.log(`📍 Signer address: ${this.signer.address}`);
  }

  /**
   * Get contract instance
   */
  getContract(contractName: keyof typeof CONTRACTS, abi: any) {
    const address = CONTRACTS[contractName];
    if (!address) {
      throw new Error(`Contract address not found for ${contractName}`);
    }
    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Get contract instance by address
   */
  getContractByAddress(address: string, abi: any) {
    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Call contract method (read-only)
   */
  async callContract(
    contractName: keyof typeof CONTRACTS,
    abi: any,
    method: string,
    ...args: any[]
  ) {
    const contract = this.getContract(contractName, abi);
    return await contract[method](...args);
  }

  /**
   * Execute contract transaction (write)
   */
  async executeContract(
    contractName: keyof typeof CONTRACTS,
    abi: any,
    method: string,
    ...args: any[]
  ) {
    const contract = this.getContract(contractName, abi);
    const tx = await contract[method](...args);
    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed: ${receipt.hash}`);
    return receipt;
  }

  /**
   * Send native token (ETH/MNT)
   */
  async sendNativeToken(to: string, amount: string) {
    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });
    console.log(`📤 Transfer sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transfer confirmed: ${receipt.hash}`);
    return receipt;
  }

  /**
   * Get balance
   */
  async getBalance(address: string) {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress: string) {
    const erc20Abi = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];
    const contract = this.getContractByAddress(tokenAddress, erc20Abi);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  /**
   * Transfer ERC20 tokens
   */
  async transferTokens(tokenAddress: string, to: string, amount: string) {
    const erc20Abi = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function decimals() view returns (uint8)',
    ];
    const contract = this.getContractByAddress(tokenAddress, erc20Abi);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(to, amountWei);
    console.log(`📤 Token transfer sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Token transfer confirmed: ${receipt.hash}`);
    return receipt;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction
   */
  async waitForTransaction(txHash: string, confirmations = 1) {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get signer address
   */
  getSignerAddress() {
    return this.signer.address;
  }

  /**
   * Get provider
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Get signer
   */
  getSigner() {
    return this.signer;
  }
}

// Create singleton instance
let mantleService: MantleContractService | null = null;

export function getMantleService(network: 'localhost' | 'mantleSepolia' = 'localhost') {
  if (!mantleService) {
    mantleService = new MantleContractService(network);
  }
  return mantleService;
}

export default MantleContractService;
