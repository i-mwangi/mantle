/**
 * Lending Web3 Service
 * Handles direct blockchain interactions for lending using MetaMask
 */

class LendingWeb3Service {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        
        // Contract addresses
        this.addresses = {
            USDC: '0xe96c82aBA229efCC7a46e46D194412C691feD1D5',
            LENDING_POOL: '0x529e03fC9d0971601e5f5FB1Ae01192AC1EB913F',
            LP_TOKEN: '0x6cE5cac2e918F7749f23169ea4E00BCEE2D42dE5',
        };

        // ABIs
        this.abis = {
            USDC: [
                'function approve(address spender, uint256 amount) returns (bool)',
                'function balanceOf(address account) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function allowance(address owner, address spender) view returns (uint256)',
            ],
            LENDING_POOL: [
                'function provideLiquidity(uint256 amount)',
                'function withdrawLiquidity(uint256 lpTokenAmount)',
                'function takeLoan(address collateralToken, uint256 collateralAmount, uint256 loanAmount)',
                'function repayLoan()',
                'function getLPToken() view returns (address)',
                'function getPoolStats() view returns (uint256 _totalLiquidity, uint256 _availableLiquidity, uint256 _totalBorrowed, uint256 _utilizationRate, uint256 _currentAPY)',
                'function getLiquidityPosition(address provider) view returns (uint256 amountProvided, uint256 lpTokensReceived, uint256 depositDate, uint256 accruedInterest)',
                'function getLoan(address borrower) view returns (address collateralToken, uint256 loanAmount, uint256 collateralAmount, uint256 repayAmount, uint256 borrowDate, bool isActive, bool isLiquidated)',
                'function isCollateralSupported(address token) view returns (bool)',
                'function getSupportedCollateral() view returns (address[] memory)',
            ],
            LP_TOKEN: [
                'function balanceOf(address account) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function totalSupply() view returns (uint256)',
                'function approve(address spender, uint256 amount) returns (bool)',
            ],
            GROVE_TOKEN: [
                'function balanceOf(address account) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function approve(address spender, uint256 amount) returns (bool)',
            ],
        };
    }

    /**
     * Initialize Web3 with MetaMask
     */
    async initialize() {
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        // Create ethers provider from MetaMask
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        console.log('✅ Lending Web3 initialized');
        console.log('📍 User address:', await this.signer.getAddress());

        return true;
    }

    /**
     * Get contract instance
     */
    getContract(name, address = null) {
        const contractAddress = address || this.addresses[name];
        if (!contractAddress) {
            throw new Error(`Contract address not found for ${name}`);
        }

        const abi = this.abis[name];
        if (!abi) {
            throw new Error(`ABI not found for ${name}`);
        }

        return new ethers.Contract(contractAddress, abi, this.signer);
    }

    /**
     * Deposit USDC and receive LP tokens
     * User signs transaction in MetaMask
     */
    async deposit(amount) {
        try {
            console.log(`💰 Depositing ${amount} USDC...`);

            const usdcContract = this.getContract('USDC');
            const lendingPoolContract = this.getContract('LENDING_POOL');

            const decimals = await usdcContract.decimals();
            const amountWei = ethers.parseUnits(amount.toString(), decimals);

            // Check USDC balance
            const userAddress = await this.signer.getAddress();
            const balance = await usdcContract.balanceOf(userAddress);
            if (balance < amountWei) {
                throw new Error(`Insufficient USDC balance. You have ${ethers.formatUnits(balance, decimals)} USDC`);
            }

            // Step 1: Check allowance
            const allowance = await usdcContract.allowance(userAddress, this.addresses.LENDING_POOL);
            
            if (allowance < amountWei) {
                console.log('📝 Approving USDC...');
                const approveTx = await usdcContract.approve(this.addresses.LENDING_POOL, amountWei);
                console.log('⏳ Waiting for approval...');
                await approveTx.wait();
                console.log('✅ USDC approved');
            } else {
                console.log('✅ USDC already approved');
            }

            // Step 2: Provide liquidity
            console.log('💰 Providing liquidity...');
            const depositTx = await lendingPoolContract.provideLiquidity(amountWei);
            console.log('⏳ Waiting for transaction...');
            const receipt = await depositTx.wait();
            console.log('✅ Liquidity provided!');

            // Step 3: Get LP token balance
            const lpTokenContract = this.getContract('LP_TOKEN');
            const lpBalance = await lpTokenContract.balanceOf(userAddress);
            const lpDecimals = await lpTokenContract.decimals();
            const lpTokensReceived = ethers.formatUnits(lpBalance, lpDecimals);

            console.log(`📊 LP tokens received: ${lpTokensReceived}`);

            return {
                success: true,
                amount,
                lpTokensReceived,
                transactionHash: receipt.hash,
            };
        } catch (error) {
            console.error('❌ Deposit failed:', error);
            return {
                success: false,
                error: error.message || 'Deposit failed',
            };
        }
    }

    /**
     * Withdraw USDC by burning LP tokens
     * User signs transaction in MetaMask
     */
    async withdraw(lpTokenAmount) {
        try {
            console.log(`💸 Withdrawing ${lpTokenAmount} LP tokens...`);

            const lendingPoolContract = this.getContract('LENDING_POOL');
            const lpTokenContract = this.getContract('LP_TOKEN');

            const lpDecimals = await lpTokenContract.decimals();
            const lpAmountWei = ethers.parseUnits(lpTokenAmount.toString(), lpDecimals);

            // Check LP token balance
            const userAddress = await this.signer.getAddress();
            const lpBalance = await lpTokenContract.balanceOf(userAddress);
            if (lpBalance < lpAmountWei) {
                throw new Error(`Insufficient LP token balance. You have ${ethers.formatUnits(lpBalance, lpDecimals)} LP tokens`);
            }

            // Withdraw liquidity
            console.log('💸 Withdrawing liquidity...');
            const withdrawTx = await lendingPoolContract.withdrawLiquidity(lpAmountWei);
            console.log('⏳ Waiting for transaction...');
            const receipt = await withdrawTx.wait();
            console.log('✅ Liquidity withdrawn!');

            // Parse event to get USDC amount
            const withdrawEvent = receipt.logs
                .map(log => {
                    try {
                        return lendingPoolContract.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(event => event?.name === 'LiquidityWithdrawn');

            const usdcAmount = withdrawEvent 
                ? ethers.formatUnits(withdrawEvent.args.amount, 6)
                : '0';

            console.log(`📊 USDC received: ${usdcAmount}`);

            return {
                success: true,
                amount: usdcAmount,
                lpTokensBurned: lpTokenAmount,
                transactionHash: receipt.hash,
            };
        } catch (error) {
            console.error('❌ Withdrawal failed:', error);
            return {
                success: false,
                error: error.message || 'Withdrawal failed',
            };
        }
    }

    /**
     * Borrow USDC using collateral
     * User signs transaction in MetaMask
     */
    async borrow(collateralTokenAddress, collateralAmount, borrowAmount) {
        try {
            console.log(`🏦 Borrowing ${borrowAmount} USDC...`);

            const lendingPoolContract = this.getContract('LENDING_POOL');
            const collateralContract = this.getContract('GROVE_TOKEN', collateralTokenAddress);

            // Check if collateral is supported
            const isSupported = await lendingPoolContract.isCollateralSupported(collateralTokenAddress);
            if (!isSupported) {
                throw new Error('Collateral token not supported');
            }

            const collateralDecimals = await collateralContract.decimals();
            const collateralWei = ethers.parseUnits(collateralAmount.toString(), collateralDecimals);
            const borrowWei = ethers.parseUnits(borrowAmount.toString(), 6); // USDC has 6 decimals

            // Check collateral balance
            const userAddress = await this.signer.getAddress();
            const collateralBalance = await collateralContract.balanceOf(userAddress);
            if (collateralBalance < collateralWei) {
                throw new Error(`Insufficient collateral balance`);
            }

            // Step 1: Approve collateral
            console.log('📝 Approving collateral...');
            const approveTx = await collateralContract.approve(this.addresses.LENDING_POOL, collateralWei);
            console.log('⏳ Waiting for approval...');
            await approveTx.wait();
            console.log('✅ Collateral approved');

            // Step 2: Take loan
            console.log('🏦 Taking loan...');
            const borrowTx = await lendingPoolContract.takeLoan(
                collateralTokenAddress,
                collateralWei,
                borrowWei
            );
            console.log('⏳ Waiting for transaction...');
            const receipt = await borrowTx.wait();
            console.log('✅ Loan taken!');

            return {
                success: true,
                borrowedAmount: borrowAmount,
                collateralAmount,
                transactionHash: receipt.hash,
            };
        } catch (error) {
            console.error('❌ Borrow failed:', error);
            return {
                success: false,
                error: error.message || 'Borrow failed',
            };
        }
    }

    /**
     * Repay loan and get collateral back
     * User signs transaction in MetaMask
     */
    async repay() {
        try {
            console.log(`💳 Repaying loan...`);

            const lendingPoolContract = this.getContract('LENDING_POOL');
            const usdcContract = this.getContract('USDC');

            // Get loan details
            const userAddress = await this.signer.getAddress();
            const loan = await lendingPoolContract.getLoan(userAddress);
            
            if (!loan.isActive) {
                throw new Error('No active loan found');
            }

            const repayAmount = ethers.formatUnits(loan.repayAmount, 6);

            // Check USDC balance
            const usdcBalance = await usdcContract.balanceOf(userAddress);
            if (usdcBalance < loan.repayAmount) {
                throw new Error(`Insufficient USDC balance. Need ${repayAmount} USDC`);
            }

            // Step 1: Approve USDC
            console.log('📝 Approving USDC...');
            const approveTx = await usdcContract.approve(this.addresses.LENDING_POOL, loan.repayAmount);
            console.log('⏳ Waiting for approval...');
            await approveTx.wait();
            console.log('✅ USDC approved');

            // Step 2: Repay loan
            console.log('💳 Repaying loan...');
            const repayTx = await lendingPoolContract.repayLoan();
            console.log('⏳ Waiting for transaction...');
            const receipt = await repayTx.wait();
            console.log('✅ Loan repaid!');

            return {
                success: true,
                repaidAmount: repayAmount,
                transactionHash: receipt.hash,
            };
        } catch (error) {
            console.error('❌ Repayment failed:', error);
            return {
                success: false,
                error: error.message || 'Repayment failed',
            };
        }
    }

    /**
     * Get pool statistics
     */
    async getPoolStats() {
        const lendingPoolContract = this.getContract('LENDING_POOL');
        const stats = await lendingPoolContract.getPoolStats();

        return {
            totalLiquidity: ethers.formatUnits(stats._totalLiquidity, 6),
            availableLiquidity: ethers.formatUnits(stats._availableLiquidity, 6),
            totalBorrowed: ethers.formatUnits(stats._totalBorrowed, 6),
            utilizationRate: Number(stats._utilizationRate) / 100,
            currentAPY: Number(stats._currentAPY) / 100,
        };
    }

    /**
     * Get user's liquidity position
     */
    async getLiquidityPosition(userAddress) {
        const lendingPoolContract = this.getContract('LENDING_POOL');
        const position = await lendingPoolContract.getLiquidityPosition(userAddress);

        return {
            amountProvided: ethers.formatUnits(position.amountProvided, 6),
            lpTokensReceived: ethers.formatUnits(position.lpTokensReceived, 18),
            depositDate: Number(position.depositDate) * 1000,
            accruedInterest: ethers.formatUnits(position.accruedInterest, 6),
        };
    }

    /**
     * Get LP token balance
     */
    async getLPTokenBalance(userAddress) {
        const lpTokenContract = this.getContract('LP_TOKEN');
        const balance = await lpTokenContract.balanceOf(userAddress);
        const decimals = await lpTokenContract.decimals();
        return ethers.formatUnits(balance, decimals);
    }

    /**
     * Get user's active loan
     */
    async getLoan(userAddress) {
        const lendingPoolContract = this.getContract('LENDING_POOL');
        const loan = await lendingPoolContract.getLoan(userAddress);

        if (!loan.isActive) {
            return null;
        }

        return {
            collateralToken: loan.collateralToken,
            loanAmount: ethers.formatUnits(loan.loanAmount, 6),
            collateralAmount: ethers.formatUnits(loan.collateralAmount, 18),
            repayAmount: ethers.formatUnits(loan.repayAmount, 6),
            borrowDate: Number(loan.borrowDate) * 1000,
            isActive: loan.isActive,
            isLiquidated: loan.isLiquidated,
        };
    }

    /**
     * Get supported collateral tokens
     */
    async getSupportedCollateral() {
        const lendingPoolContract = this.getContract('LENDING_POOL');
        return await lendingPoolContract.getSupportedCollateral();
    }
}

// Create global instance
window.lendingWeb3 = new LendingWeb3Service();

console.log('✅ Lending Web3 service loaded');
