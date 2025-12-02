require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun"
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mantleTestnet: {
      url: process.env.MANTLE_RPC_URL || "https://rpc.testnet.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5003,
    },
    mantleMainnet: {
      url: process.env.MANTLE_MAINNET_RPC_URL || "https://rpc.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5000,
    },
  },
  etherscan: {
    apiKey: {
      mantleTestnet: process.env.MANTLE_API_KEY || "no-api-key-needed",
      mantleMainnet: process.env.MANTLE_API_KEY || "no-api-key-needed",
    },
    customChains: [
      {
        network: "mantleTestnet",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz"
        }
      },
      {
        network: "mantleMainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts/mantle",
    tests: "./test/mantle",
    cache: "./cache/hardhat",
    artifacts: "./artifacts/hardhat"
  }
};
