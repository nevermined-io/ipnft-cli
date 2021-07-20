import { Config } from "@nevermined-io/nevermined-sdk-js";
import HDWalletProvider from "@truffle/hdwallet-provider";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.INFURA_TOKEN) {
  throw new Error(
    "ERROR: 'INFURA_TOKEN' not set in environment! Please see README.md for details."
  );
}

if (!process.env.MNEMONIC) {
  throw new Error(
    "ERROR: 'MNEMONIC' not set in environment! Please see README.md for details."
  );
}

const config: { [index: string]: any } = {
  rinkeby: {
    nvm: {
      // default nvm rinkeby faucet
      faucetUri: "https://faucet.rinkeby.nevermined.rocks",
      // vita dao specific services
      metadataUri: "https://metadata.vitadao.nevermined.rocks/",
      gatewayUri: "https://gateway.vitadao.nevermined.rocks/",
      // default infura rinkeby endpoint
      nodeUri: `https://rinkeby.infura.io/v3/${process.env.INFURA_TOKEN}`,
    } as Config,
    etherscanUrl: "https://rinkeby.etherscan.io",
    nftTokenAddress:
      process.env.TOKEN_ADDRESS || "0xa25fd714136E2128e38fB434DBfE344276071CD0",
    seed: process.env.MNEMONIC,
  },
};

export function getConfig(network: string) {
  if (!config[network])
    throw new Error(`Network '${network}' is not supported`);

  return {
    ...config[network],
    nvm: {
      ...config[network].nvm,
      web3Provider: new HDWalletProvider(
        config[network].seed,
        config[network].nvm.nodeUri,
        0,
        3
      ),
    },
  };
}
