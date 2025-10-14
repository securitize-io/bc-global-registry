import '@nomiclabs/hardhat-solhint';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-docgen';
import 'dotenv/config';
import './tasks/deploy-all';
import './tasks/deploy-grs';
import './tasks/deploy-grs-mock-v2';
import './tasks/verify-grs';

const config: HardhatUserConfig = {
  mocha: {
    parallel: false,
    timeout: 20000,
  },
  solidity: {
    version: '0.8.22',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  docgen: {
    outputDir: './docs',
    pages: 'items',
    exclude: ['mocks'],
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.API_KEY_ETHERSCAN || "",
      sepolia: process.env.API_KEY_ETHERSCAN || "",
      arbitrum: process.env.API_KEY_ARBISCAN || "",
      optimistic: process.env.API_KEY_OPTIMISTIC || "",
      avalanche: process.env.API_KEY_AVALANCHE || "",
      fuji: process.env.API_KEY_AVALANCHE || "",
    },
    customChains: [
      {
        network: 'fuji',
        chainId: 43113,
        urls: {
          apiURL: process.env.API_URL_AVALANCHE || "",
          browserURL: process.env.BROWSER_URL_AVALANCHE || "",
        },
      },
    ],
  },
  networks: {
    fuji: {
      chainId: 43113,
      url: process.env.AVALANCHE_RPC_URL ?? '',
      accounts: [process.env.DEPLOYER_PRIV_KEY!].filter((x) => x),
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL ?? '',
      accounts: [process.env.DEPLOYER_PRIV_KEY!].filter((x) => x),
    },
    arbitrum: {
      chainId: 421614,
      gas: 'auto',
      url: process.env.ARBITRUM_RPC_URL ?? '',
      accounts: [process.env.DEPLOYER_PRIV_KEY!].filter((x) => x),
      allowUnlimitedContractSize: true,
    },
    optimism: {
      chainId: 11155420,
      url: process.env.OPTIMISM_RPC_URL ?? '',
      accounts: [process.env.DEPLOYER_PRIV_KEY!].filter((x) => x),
    },
  },
};

export default config;
