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
import './tasks/add-investor-eip-712';

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
    apiKey: process.env.API_KEY_ETHERSCAN,
  },
  networks: {
    fuji: {
      chainId: 43113,
      url: process.env.AVALANCHE_RPC_URL ?? '',
      accounts: [
        process.env.DEPLOYER_PRIV_KEY!,
        process.env.OPERATOR_PRIV_KEY!,
        process.env.INVESTOR_1_PRIV_KEY!,
        process.env.INVESTOR_2_PRIV_KEY!
      ].filter((x) => x),
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
