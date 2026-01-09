/**
 * Token Manager - Handles automatic token addition to MetaMask
 */

class TokenManager {
    /**
     * Add a token to MetaMask
     * @param {string} tokenAddress - Token contract address
     * @param {string} tokenSymbol - Token symbol (e.g., "MWENYA")
     * @param {number} decimals - Token decimals (usually 18)
     * @param {string} tokenImage - Optional token image URL
     * @returns {Promise<boolean>} - True if user added the token
     */
    async addTokenToMetaMask(tokenAddress, tokenSymbol, decimals = 18, tokenImage = null) {
        try {
            if (!window.ethereum) {
                console.error('MetaMask not installed');
                return false;
            }

            console.log('📝 Adding token to MetaMask:', {
                address: tokenAddress,
                symbol: tokenSymbol,
                decimals
            });

            // Request to add token to MetaMask
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: decimals,
                        image: tokenImage,
                    },
                },
            });

            if (wasAdded) {
                console.log('✅ Token added to MetaMask successfully');
                return true;
            } else {
                console.log('❌ User declined to add token');
                return false;
            }
        } catch (error) {
            console.error('Error adding token to MetaMask:', error);
            return false;
        }
    }

    /**
     * Add USDC token to MetaMask
     */
    async addUSDCToken() {
        const usdcAddress = '0xe96c82aBA229efCC7a46e46D194412C691feD1D5'; // Mantle Sepolia USDC
        return await this.addTokenToMetaMask(
            usdcAddress,
            'USDC',
            6, // USDC has 6 decimals
            'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
        );
    }

    /**
     * Add a grove token to MetaMask
     * @param {string} tokenAddress - Grove token address
     * @param {string} groveName - Grove name (e.g., "mwenya")
     * @param {number} decimals - Token decimals (default 18)
     */
    async addGroveToken(tokenAddress, groveName, decimals = 18) {
        // Create a symbol from grove name (max 11 characters for MetaMask)
        const symbol = groveName.toUpperCase().substring(0, 11);
        
        return await this.addTokenToMetaMask(
            tokenAddress,
            symbol,
            decimals,
            null // Could add grove logo here
        );
    }

    /**
     * Show notification to add token
     * @param {string} tokenAddress - Token address
     * @param {string} tokenName - Token name
     * @param {string} tokenSymbol - Token symbol
     */
    showAddTokenNotification(tokenAddress, tokenName, tokenSymbol) {
        if (window.notificationManager) {
            const message = `
                <div style="text-align: left;">
                    <strong>🎉 Grove Tokenized!</strong><br/>
                    <span style="font-size: 14px;">
                        Your ${tokenName} grove tokens are ready!<br/>
                        Click to add ${tokenSymbol} to MetaMask.
                    </span>
                </div>
            `;
            
            window.notificationManager.success(message, {
                duration: 10000, // Show for 10 seconds
                onClick: () => {
                    this.addGroveToken(tokenAddress, tokenName);
                }
            });
        }
    }

    /**
     * Automatically add token after tokenization
     * @param {Object} grove - Grove object with tokenAddress and groveName
     */
    async autoAddTokenAfterTokenization(grove) {
        if (!grove.tokenAddress) {
            console.error('No token address provided');
            return false;
        }

        console.log('🎉 Grove tokenized! Auto-adding token to MetaMask...');
        
        // Wait a moment for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Automatically prompt to add token
        const added = await this.addGroveToken(
            grove.tokenAddress,
            grove.groveName || 'Grove'
        );

        if (added) {
            if (window.notificationManager) {
                window.notificationManager.success(
                    `✅ ${grove.groveName} tokens added to MetaMask! Check your wallet.`
                );
            }
        } else {
            // Show manual add option
            this.showAddTokenNotification(
                grove.tokenAddress,
                grove.groveName,
                grove.groveName.toUpperCase()
            );
        }

        return added;
    }

    /**
     * Check if token is already in MetaMask
     * @param {string} tokenAddress - Token address
     * @returns {Promise<boolean>}
     */
    async isTokenInMetaMask(tokenAddress) {
        try {
            if (!window.ethereum) return false;

            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length === 0) return false;

            // Try to get balance - if it works, token might be added
            const balance = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: tokenAddress,
                    data: '0x70a08231000000000000000000000000' + accounts[0].substring(2)
                }, 'latest']
            });

            return balance !== null;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
window.tokenManager = new TokenManager();

console.log('✅ Token Manager initialized');
