require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

const { SEPOLIA_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  allowUnlimitedContractSize: true,
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 9,
    ethPrice: 3300,
  },
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
    },
    hardhat: {
      accounts: {
        count: 50,
        initialIndex: 0,
        accountsBalance: "10000000000000000000000", // 10,000 ETH
      },
      blockGasLimit: 2000000000,
      allowUnlimitedContractSize: true,
    },
    localhost2: {
      url: "http://127.0.0.1:8546", // Second Hardhat node for parallel testing
    },
    localhost3: {
      url: "http://127.0.0.1:8547", // Second Hardhat node for parallel testing
    },
    localhost4: {
      url: "http://127.0.0.1:8548", // Second Hardhat node for parallel testing
    },
  },
};
