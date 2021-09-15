const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");

require("dotenv").config();

console.log('Infura addr  : '+process.env.INFURA_ADDR);
console.log('Rinkeby addr : '+process.env.RINKEBY_ADDR);
// console.log('Secret is    : '+process.env.PRIVATE_KEY);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    // Le network developpement est pris par défaut par les commande Truffle
    // sinon il faut préciser --network [nom du reseau] à la commande
    //
        development: {
          host: "127.0.0.1",     // Localhost (default: none)
          port: 7545,            // Standard Ethereum port (default: none) -> Deploiement sur Ganache
          network_id: "5777",    // Any network (default: none)
        },
        
        geth : {
          host: "127.0.0.1",     // Localhost (default: none)
          port: 8565,            // Standard Ethereum port (default: none) -> Deploiement sur Geth
          network_id: "2222",    // Any network (default: none)
        },

        ganache: {
          host: "127.0.0.1",     // Localhost (default: none)
          port: 7545,            // Standard Ethereum port (default: none) -> Deploiement sur Ganache
          network_id: "5777",    // Any network (default: none)
        },
        docker: {
          host: "127.0.0.1",     // Localhost (default: none)
          port: 8555,            // Standard Ethereum port (default: none) -> Deploiement sur Docker-Geth
          network_id: "2223",    // Any network (default: none)
        },

        ropsten: {
          provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, process.env.INFURA_ADDR),
          network_id: 3,         // Ropsten's id
          gas: 3000000,         // Ropsten has a lower block limit than mainnet
          confirmations: 2,      // # of confs to wait between deployments. (default: 0)
          timeoutBlocks: 200,    // # of blocks before a deployment times out  (minimum/default: 50)
        },
        
        rinkeby : {
          provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RINKEBY_ADDR),
          network_id: 4,       // Rinkeby id
          gas: 4500000         // Rinkeby gas used
        },
      },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.2",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,     // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: false,
         runs: 200
       },
       evmVersion: "byzantium"
      }
    }
  },
};
