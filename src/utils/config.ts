import { Config } from "@nevermined-io/nevermined-sdk-js";
import HDWalletProvider from "@truffle/hdwallet-provider";
import dotenv from "dotenv";
import { LogLevel } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

dotenv.config();

interface CliConfig {
  [index: string]: ConfigEntry;
}

export interface ConfigEntry {
  nvm: Config;
  etherscanUrl: string;
  nftTokenAddress: string;
  erc20TokenAddress: string;
  seed: string;
}

const config: CliConfig = {
  rinkeby: {
    nvm: {
      // default nvm rinkeby faucet
      faucetUri: "https://faucet.rinkeby.nevermined.rocks",
      // vita dao specific services
      metadataUri: "https://metadata.vitadao.nevermined.rocks",
      gatewayUri: "https://gateway.vitadao.nevermined.rocks",
      gatewayAddress: "0xF8D50e0e0F47c5dbE943AeD661cCF25c3468c44f",
      // default infura rinkeby endpoint
      nodeUri: `https://rinkeby.infura.io/v3/${process.env.INFURA_TOKEN}`,
      verbose: LogLevel.Error,
    } as Config,
    etherscanUrl: "https://rinkeby.etherscan.io",
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // IPNFT Contract from Vita DAO
      "0xa25fd714136E2128e38fB434DBfE344276071CD0",
    erc20TokenAddress:
      process.env.ERC20_TOKEN_ADDRESS ||
      // Nevermined Token
      "0x8c8b41e349f1a0a3c2b3ed342058170f995dbb8e",
    seed: process.env.MNEMONIC,
  } as ConfigEntry,
};

export function getConfig(network: string): ConfigEntry {
  if (!config[network])
    throw new Error(`Network '${network}' is not supported`);

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
