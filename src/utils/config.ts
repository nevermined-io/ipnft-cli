import { Config } from "@nevermined-io/nevermined-sdk-js";
import HDWalletProvider from "@truffle/hdwallet-provider";
import dotenv from "dotenv";
dotenv.config();

const config: { [index: string]: any } = {
  rinkeby: {
    nvm: {
      metadataUri: "https://metadata.rinkeby.nevermined.rocks",
      faucetUri: "https://faucet.rinkeby.nevermined.rocks",
      gatewayUri: "https://gateway.rinkeby.nevermined.rocks",
      nodeUri: `https://rinkeby.infura.io/v3/${process.env.INFURA_TOKEN}`
    } as Config,
    etherscanUrl: "https://rinkeby.etherscan.io",
    nftTokenAddress: process.env.TOKEN_ADDRESS || "0xa25fd714136E2128e38fB434DBfE344276071CD0",
    seed: process.env.MNEMONIC
  }
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
      )
    }
  };
}
