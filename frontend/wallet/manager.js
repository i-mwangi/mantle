/**
 * Main Wallet Manager
 * Provides simple API for the rest of the app
 */

import { metaMaskWallet } from './metamask-connector.js';
import { walletState } from './state.js';

export class WalletManager {
  constructor() {
    console.log('Creating WalletManager instance');
    console.log('metaMaskWallet:', metaMaskWallet);
    console.log('walletState:', walletState);
    
    this.userType = null;
    
    // Subscribe to state changes
    walletState.subscribe(state => {
      this.onStateChange(state);
    });
  }

  /**
   * Initialize wallet manager
   */
  async init() {
    try {
      console.log('Initializing WalletManager...');
      
      // Setup button event listeners
      this.setupEventListeners();
      
      // Check if user was previously connected
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      const savedAccount = localStorage.getItem('connectedAccount');
      
      if (wasConnected && savedAccount && window.ethereum) {
        console.log('🔄 Auto-reconnecting to previously connected wallet...');
        try {
          // Check if MetaMask still has this account connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0 && accounts[0] === savedAccount) {
            // Silently reconnect without popup
            await metaMaskWallet.connect();
            console.log('✅ Auto-reconnected successfully');
          } else {
            // Clear stale connection data
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('connectedAccount');
          }
        } catch (error) {
          console.log('Auto-reconnect failed:', error.message);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('connectedAccount');
        }
      } else {
        console.log('✅ Wallet manager initialized. Click "Connect Wallet" to connect.');
      }
      
      // Load user type from localStorage
      this.userType = localStorage.getItem('userType') || 'investor';
      console.log('User type:', this.userType);
      
      // Update UI
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
    }
  }

  /**
   * Setup event listeners for wallet buttons
   */
  setupEventListeners() {
    // Track if listeners are already attached to prevent duplicates
    this._listenersAttached = this._listenersAttached || {};
    
    const setupButtons = () => {
      const connectBtn = document.getElementById('connect-wallet-btn');
      const disconnectBtn = document.getElementById('disconnectWallet');
      const dashboardConnectBtn = document.getElementById('dashboardConnectBtn');
      
      // Main connect button - use direct onclick to ensure it works
      if (connectBtn && !this._listenersAttached.connectBtn) {
        console.log('✅ Setting up connect button event listener');
        // Use onclick assignment to avoid duplicate listeners
        connectBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 Connect button clicked!');
          this.connect();
        };
        this._listenersAttached.connectBtn = true;
      } else if (!connectBtn) {
        console.warn('⚠️ Connect button not found');
      }
      
      // Disconnect button
      if (disconnectBtn && !this._listenersAttached.disconnectBtn) {
        console.log('✅ Setting up disconnect button event listener');
        disconnectBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 Disconnect button clicked!');
          this.disconnect();
        };
        this._listenersAttached.disconnectBtn = true;
      }
      
      // Dashboard connect button
      if (dashboardConnectBtn && !this._listenersAttached.dashboardConnectBtn) {
        console.log('✅ Setting up dashboard connect button event listener');
        dashboardConnectBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 Dashboard connect button clicked!');
          this.connect();
        };
        this._listenersAttached.dashboardConnectBtn = true;
      }
    };
    
    // Try to setup immediately
    setupButtons();
    
    // Also setup after a short delay to catch dynamically loaded elements
    setTimeout(setupButtons, 500);
    
    // And setup after full page load as a fallback
    window.addEventListener('load', () => {
      setTimeout(setupButtons, 100);
    });
  }

  /**
   * Connect wallet
   */
  async connect() {
    console.log('🔌 WalletManager.connect() called');
    
    try {
      // Check if MetaMask is available first
      if (!window.ethereum) {
        console.error('❌ MetaMask not detected - window.ethereum is undefined');
        this.showToast('MetaMask is not installed. Please install MetaMask to continue.', 'error');
        return;
      }
      
      console.log('✅ MetaMask detected, requesting connection...');
      this.showLoading('Connecting to MetaMask...');
      
      // Connect to MetaMask
      const result = await metaMaskWallet.connect();
      console.log('✅ MetaMask connect result:', result);
      
      if (result.success) {
        // Check if on correct network (localhost or Mantle Sepolia)
        const chainId = result.chainId;
        if (chainId !== 31337 && chainId !== 5003) {
          this.showToast('Please switch to Mantle Sepolia or Localhost network', 'warning');
          // Optionally auto-switch
          try {
            await metaMaskWallet.switchToMantle(5003);
          } catch (switchError) {
            console.error('Failed to switch network:', switchError);
          }
        }
        
        this.hideLoading();
        this.showToast('Wallet connected successfully!', 'success');
        
        // Save to localStorage
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('connectedAccount', result.accountId);
        localStorage.setItem('userType', this.userType);
        
        // Notify app
        this.notifyWalletConnected();
        
        return result;
      }
      
    } catch (error) {
      console.error('Connection error:', error);
      this.hideLoading();
      
      let message = 'Failed to connect wallet';
      if (error.message) {
        message = error.message;
      }
      
      this.showToast(message, 'error');
      throw error;
    }
  }

  /**
   * Set intended user type - used when navigating to a specific view
   */
  setIntendedUserType(type) {
    this.userType = type;
    localStorage.setItem('userType', type);
  }

  /**
   * Get intended user type
   */
  getIntendedUserType() {
    return this.userType;
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    try {
      await metaMaskWallet.disconnect();
      
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('connectedAccount');
      localStorage.removeItem('userType');
      
      this.userType = null;
      
      this.updateUI();
      this.showToast('Wallet disconnected', 'info');
      
      // Notify app
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));
      
    } catch (error) {
      console.error('Disconnect error:', error);
      this.showToast('Failed to disconnect', 'error');
    }
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected() {
    const isConnected = walletState.getState().isConnected;
    console.log('isWalletConnected() called - returning:', isConnected);
    console.log('Full wallet state:', walletState.getState());
    return isConnected;
  }

  /**
   * Get connected account ID
   */
  getAccountId() {
    const accountId = walletState.getState().accountId;
    console.log('getAccountId() called - returning:', accountId);
    return accountId;
  }

  /**
   * Get user type
   */
  getUserType() {
    return this.userType;
  }

  /**
   * Set user type
   */
  setUserType(type) {
    this.userType = type;
    localStorage.setItem('userType', type);
  }

  /**
   * Require farmer role - checks if user is a farmer
   */
  requireFarmer() {
    if (!this.isWalletConnected()) {
      this.showToast('Please connect your wallet first', 'warning');
      return false;
    }
    
    if (this.getUserType() !== 'farmer') {
      this.showToast('This action requires farmer privileges', 'warning');
      return false;
    }
    
    return true;
  }

  /**
   * Require investor role - checks if user is an investor
   */
  requireInvestor() {
    if (!this.isWalletConnected()) {
      this.showToast('Please connect your wallet first', 'warning');
      return false;
    }
    
    if (this.getUserType() !== 'investor') {
      this.showToast('This action requires investor privileges', 'warning');
      return false;
    }
    
    return true;
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, amount) {
    try {
      const result = await metaMaskWallet.sendTransaction(to, amount);
      this.showToast('Transaction sent successfully!', 'success');
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      this.showToast('Transaction failed: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * Call contract (read-only)
   */
  async callContract(contractAddress, abi, method, ...args) {
    return await metaMaskWallet.callContract(contractAddress, abi, method, ...args);
  }

  /**
   * Execute contract transaction (write)
   */
  async executeContract(contractAddress, abi, method, ...args) {
    try {
      const result = await metaMaskWallet.executeContract(contractAddress, abi, method, ...args);
      this.showToast('Transaction confirmed!', 'success');
      return result;
    } catch (error) {
      console.error('Contract execution error:', error);
      this.showToast('Transaction failed: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * Update UI based on connection state
   */
  updateUI() {
    console.log('Updating UI based on connection state...');
    console.log('isWalletConnected():', this.isWalletConnected());
    console.log('getAccountId():', this.getAccountId());
    
    // Update connect button
    const connectBtn = document.getElementById('connect-wallet-btn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    
    if (connectBtn) {
      if (this.isWalletConnected()) {
        // Hide connect button, show wallet info
        connectBtn.classList.add('hidden');
        if (walletInfo) {
          walletInfo.classList.remove('hidden');
        }
        if (walletAddress) {
          const accountId = this.getAccountId();
          const shortAddress = accountId ? 
            `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : 
            'No account';
          walletAddress.textContent = shortAddress;
          walletAddress.title = accountId; // Show full address on hover
        }
      } else {
        // Show connect button, hide wallet info
        connectBtn.classList.remove('hidden');
        connectBtn.textContent = 'Connect Wallet';
        // Don't override onclick - it's set in setupEventListeners
        if (walletInfo) {
          walletInfo.classList.add('hidden');
        }
      }
    }
  }

  /**
   * Show loading indicator
   */
  showLoading(message) {
    // Create or show loading overlay
    let loadingOverlay = document.getElementById('wallet-loading-overlay');
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'wallet-loading-overlay';
      loadingOverlay.className = 'wallet-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="wallet-loading-content">
          <div class="wallet-spinner"></div>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    } else {
      loadingOverlay.querySelector('p').textContent = message;
      loadingOverlay.classList.remove('hidden');
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('wallet-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Use existing notification manager if available
    if (window.notificationManager) {
      // Call the appropriate method based on type
      switch(type) {
        case 'success':
          window.notificationManager.success(message);
          break;
        case 'error':
          window.notificationManager.error(message);
          break;
        case 'warning':
          window.notificationManager.warning(message);
          break;
        case 'info':
        default:
          window.notificationManager.info(message);
          break;
      }
    } else {
      // Fallback to console
      console.log(`[${type}]`, message);
    }
  }

  /**
   * Notify app that wallet is connected
   */
  notifyWalletConnected() {
    window.dispatchEvent(new CustomEvent('wallet-connected', {
      detail: {
        accountId: this.getAccountId(),
        userType: this.getUserType()
      }
    }));
  }

  /**
   * Handle state changes
   */
  onStateChange(state) {
    // Update UI when state changes
    this.updateUI();
  }
}

// Create global instance
export const walletManager = new WalletManager();