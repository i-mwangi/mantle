/**
 * MetaMask Connector for Mantle Network
 * Replaces HashConnect/Hedera wallet integration
 */

import { walletState } from './state.js';

// Get ethers from window (loaded via CDN script tag)
function getEthers() {
  if (typeof window.ethers === 'undefined') {
    throw new Error('Ethers.js not loaded. Please ensure the ethers CDN script is loaded before this module.');
  }
  return window.ethers;
}

export class MetaMaskConnector {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.isConnecting = false; // Guard against multiple simultaneous connections
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  }

  /**
   * Connect to MetaMask
   */
  async connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('⏳ Connection already in progress, please wait...');
      throw new Error('Connection already in progress. Please check MetaMask.');
    }

    try {
      this.isConnecting = true;
      console.log('🔌 MetaMaskConnector.connect() starting...');
      
      const ethers = getEthers();
      console.log('✅ Ethers loaded:', !!ethers);
      
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      console.log('✅ MetaMask is installed');

      // Force MetaMask popup by requesting permissions
      // This will ALWAYS show the popup, even if already connected
      console.log('📱 Requesting MetaMask permissions (popup will appear)...');
      
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (permError) {
        // If permissions request fails due to pending request, try direct connection
        if (permError.code === -32002) {
          console.log('⚠️ Pending request detected, trying direct connection...');
          // Fall through to eth_requestAccounts below
        } else {
          throw permError;
        }
      }
      
      // Now get the accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      console.log('✅ Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();

      // Update state
      walletState.setState({
        isConnected: true,
        accountId: address,
        chainId: Number(network.chainId),
        provider: this.provider,
        signer: this.signer
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          walletState.setState({ accountId: accounts[0] });
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      console.log('✅ Connected to MetaMask:', address);
      return { success: true, accountId: address, chainId: Number(network.chainId) };

    } catch (error) {
      console.error('❌ MetaMask connection error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      throw error;
    } finally {
      this.isConnecting = false; // Reset the guard
    }
  }

  /**
   * Silently reconnect to MetaMask (no popup)
   * Used for auto-reconnect on page load
   */
  async reconnect() {
    try {
      console.log('🔄 MetaMaskConnector.reconnect() starting (silent)...');
      
      const ethers = getEthers();
      
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      // Get accounts without requesting permissions (no popup)
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts connected');
      }

      console.log('✅ Found connected accounts:', accounts);

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();

      // Update state
      walletState.setState({
        isConnected: true,
        accountId: address,
        chainId: Number(network.chainId),
        provider: this.provider,
        signer: this.signer
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          walletState.setState({ accountId: accounts[0] });
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      console.log('✅ Silently reconnected to MetaMask:', address);
      return { success: true, accountId: address, chainId: Number(network.chainId) };

    } catch (error) {
      console.error('❌ Silent reconnect failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    this.provider = null;
    this.signer = null;
    walletState.reset();
    console.log('✅ Disconnected from MetaMask');
  }

  /**
   * Switch to Mantle network
   */
  async switchToMantle(chainId = 5003) {
    try {
      const chainIdHex = '0x' + chainId.toString(16);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      console.log('✅ Switched to Mantle network');
    } catch (error) {
      // Chain not added, try adding it
      if (error.code === 4902) {
        await this.addMantleNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add Mantle network to MetaMask
   */
  async addMantleNetwork(chainId = 5003) {
    const networks = {
      5003: {
        chainId: '0x138B',
        chainName: 'Mantle Sepolia Testnet',
        nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
        blockExplorerUrls: ['https://sepolia.mantlescan.xyz']
      },
      31337: {
        chainId: '0x7A69',
        chainName: 'Localhost 8545',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: []
      }
    };

    const networkConfig = networks[chainId];
    if (!networkConfig) {
      throw new Error(`Network ${chainId} not configured`);
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });

    console.log('✅ Added Mantle network to MetaMask');
  }

  /**
   * Get current account
   */
  getAccount() {
    return walletState.getState().accountId;
  }

  /**
   * Get signer for transactions
   */
  getSigner() {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return this.signer;
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, value) {
    const ethers = getEthers();
    const signer = this.getSigner();
    
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(value.toString())
    });

    console.log('📤 Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);

    return receipt;
  }

  /**
   * Call contract method (read-only)
   */
  async callContract(contractAddress, abi, method, ...args) {
    const ethers = getEthers();
    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    return await contract[method](...args);
  }

  /**
   * Execute contract transaction (write)
   */
  async executeContract(contractAddress, abi, method, ...args) {
    const ethers = getEthers();
    const signer = this.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    const tx = await contract[method](...args);
    console.log('📤 Contract transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Contract transaction confirmed:', receipt.hash);
    
    return receipt;
  }
}

// Create global instance
export const metaMaskWallet = new MetaMaskConnector();
