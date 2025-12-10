/**
 * MetaMask Wallet Integration
 * Main entry point for Mantle Network
 */

// Debug: Log when this file is loaded
console.log('Loading wallet/index.js (MetaMask)');

// Import all modules
import './state.js';
import { walletManager } from './manager.js';
import { metaMaskWallet } from './metamask-connector.js';
import { walletState } from './state.js';

// Export for use in other modules
export { walletManager };
export { metaMaskWallet };
export { walletState };

// CRITICAL: Make wallet objects globally available
window.walletManager = walletManager;
window.metaMaskWallet = metaMaskWallet;
window.walletState = walletState;

console.log('✅ Wallet objects exposed globally:', {
  walletManager: window.walletManager,
  metaMaskWallet: window.metaMaskWallet,
  walletState: window.walletState
});

// Initialize on DOM ready or when called explicitly
function initWallet() {
  console.log('Initializing MetaMask wallet...');
  try {
    console.log('🚀 Initializing MetaMask Wallet...');
    console.log('walletManager:', walletManager);
    
    // Check if walletManager is properly initialized
    if (!walletManager) {
      console.error('walletManager is not properly initialized');
      return;
    }
    
    // Check if MetaMask is installed
    if (!metaMaskWallet.isMetaMaskInstalled()) {
      console.warn('⚠️ MetaMask is not installed');
      console.log('Please install MetaMask: https://metamask.io/download/');
    } else {
      console.log('✅ MetaMask detected');
    }
    
    // Log the wallet manager state before initialization
    console.log('Wallet manager state before init:', walletManager);
    
    walletManager.init().then(() => {
      console.log('✅ Wallet manager ready');
      // Log the wallet manager state after initialization
      console.log('Wallet manager state after init:', walletManager);
    }).catch(error => {
      console.error('❌ Failed to initialize wallet:', error);
    });
  } catch (error) {
    console.error('❌ Failed to initialize wallet:', error);
  }
}

// Make initWallet available globally
window.initWallet = initWallet;

// Initialize on DOM ready if not already initialized
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWallet);
} else {
  // If DOM is already loaded, initialize immediately
  if (document.documentElement) {
    initWallet();
  }
}
