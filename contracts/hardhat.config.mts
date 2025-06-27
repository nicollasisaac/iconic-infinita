require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


module.exports = {
  solidity: "0.8.21", // ou outra versão compatível com seu contrato
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",      // RPC da rede
      chainId: 84532,                       // Chain ID da Base Sepolia
      accounts: [process.env.PRIVATE_KEY],  // Sua chave privada via .env
    },
  },
};
