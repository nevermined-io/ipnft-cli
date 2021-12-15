import { Config } from "@nevermined-io/nevermined-sdk-js";
import HDWalletProvider from "@truffle/hdwallet-provider";
import dotenv from "dotenv";
import { LogLevel } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";
import Web3 from 'web3'
import fs from 'fs'

dotenv.config();

interface CliConfig {
  [index: string]: ConfigEntry;
}

export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface ConfigEntry {
  nvm: Config;
  etherscanUrl: string;
  nftTokenAddress: string;
  erc20TokenAddress: string;
  seed?: string;
  buyerKeyfile?: string;
  buyerPassword?: string;
  creatorKeyfile?: string;
  creatorPassword?: string;
  minterKeyfile?: string;
  minterPassword?: string;
  s3?: S3Config;
}

const config: CliConfig = {
  local: {
    nvm: {
      faucetUri: "http://localhost:8545",
      metadataUri: "http://localhost:5000",
      gatewayUri: "http://localhost:8030",
      gatewayAddress: "0xF8D50e0e0F47c5dbE943AeD661cCF25c3468c44f",
      nodeUri: `http://localhost:8545`,
      verbose: LogLevel.Error
    } as Config,
    etherscanUrl: "https://rinkeby.etherscan.io",
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // IPNFT Contract from Vita DAO
      "0x884AAAAf48D4A7B4Dc4CB9B2cf47a150b3d535A6",
    erc20TokenAddress:
      process.env.ERC20_TOKEN_ADDRESS ||
      // Nevermined Token
      "0x02175de5A7F168517688e3E93f55936C9c2C7A19",
    seed: process.env.MNEMONIC,
    buyerKeyfile: process.env.BUYER_KEYFILE,
    buyerPassword: process.env.BUYER_PASSWORD,
    creatorKeyfile: process.env.CREATOR_KEYFILE,
    creatorPassword: process.env.CREATOR_PASSWORD,
    s3: {
      endpoint: 'http://127.0.0.1:9000',
      accessKeyId: 'L70GX5Y60L73KUKH92KV',
      secretAccessKey: 'S4Qa6m9QM16TKvuVzImXaCfYG4JLgykMKDpp+5Zz'
    },
    minterKeyfile: process.env.MINTER_KEYFILE,
    minterPassword: process.env.MINTER_PASSWORD
  } as ConfigEntry,
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
      verbose: LogLevel.Error
    } as Config,
    etherscanUrl: "https://rinkeby.etherscan.io",
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // IPNFT Contract from Vita DAO
      "0xa25fd714136E2128e38fB434DBfE344276071CD0",
    erc20TokenAddress:
      process.env.ERC20_TOKEN_ADDRESS ||
      // Nevermined Token
      //"0x8c8b41e349f1a0a3c2b3ed342058170f995dbb8e",
      // WETH
      "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    s3: {
        endpoint: process.env.S3ENDPOINT,
        accessKeyId: process.env.S3ACCESSKEYID,
        secretAccessKey: process.env.S3SECRETACCESSKEY
    },
    seed: process.env.MNEMONIC,
    buyerKeyfile: process.env.BUYER_KEYFILE,
    buyerPassword: process.env.BUYER_PASSWORD,
    creatorKeyfile: process.env.CREATOR_KEYFILE,
    creatorPassword: process.env.CREATOR_PASSWORD,
    minterKeyfile: process.env.MINTER_KEYFILE,
    minterPassword: process.env.MINTER_PASSWORD
  } as ConfigEntry,
  mainnet: {
    nvm: {
      // default nvm rinkeby faucet
      faucetUri: "https://faucet.rinkeby.nevermined-mainnet.rocks",
      // vita dao specific services
      metadataUri: "https://metadata.vitadao-mainnet.nevermined.rocks",
      gatewayUri: "https://gateway.vitadao-mainnet.nevermined.rocks",
      gatewayAddress: "0xF8D50e0e0F47c5dbE943AeD661cCF25c3468c44f",
      // default infura rinkeby endpoint
      nodeUri: `https://mainnet.infura.io/v3/${process.env.INFURA_TOKEN}`,
      verbose: LogLevel.Error
    } as Config,
    etherscanUrl: "https://etherscan.io",
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // IPNFT Contract from Vita DAO
      "0xa25fd714136E2128e38fB434DBfE344276071CD0",
    erc20TokenAddress:
      process.env.ERC20_TOKEN_ADDRESS ||
      // Nevermined Token
      //"0x8c8b41e349f1a0a3c2b3ed342058170f995dbb8e",
      // WETH
      "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    seed: process.env.MNEMONIC,
    s3: {
      endpoint: process.env.S3ENDPOINT,
      accessKeyId: process.env.S3ACCESSKEYID,
      secretAccessKey: process.env.S3SECRETACCESSKEY
    },
    buyerKeyfile: process.env.BUYER_KEYFILE,
    buyerPassword: process.env.BUYER_PASSWORD,
    creatorKeyfile: process.env.CREATOR_KEYFILE,
    creatorPassword: process.env.CREATOR_PASSWORD,
    minterKeyfile: process.env.MINTER_KEYFILE,
    minterPassword: process.env.MINTER_PASSWORD
  } as ConfigEntry
};

export function getConfig(network: string): ConfigEntry {
  if (!config[network])
    throw new Error(`Network '${network}' is not supported`);

  /*
  if (!process.env.INFURA_TOKEN) {
    throw new Error(
      "ERROR: 'INFURA_TOKEN' not set in environment! Please see README.md for details."
    );
  }*/

  if (!process.env.MNEMONIC) {
    if (
      !process.env.CREATOR_KEYFILE ||
      !process.env.CREATOR_PASSWORD ||
      !process.env.BUYER_KEYFILE ||
      !process.env.BUYER_PASSWORD ||
      !process.env.MINTER_KEYFILE ||
      !process.env.MINTER_PASSWORD) {
    throw new Error(
      "ERROR: 'MNEMONIC' or 'KEYFILE' not set in environment! Please see README.md for details."
    );
    }
  }

  let hdWalletProvider: HDWalletProvider
  if (!process.env.MNEMONIC) {
    hdWalletProvider = new HDWalletProvider(
      [
        getPrivateKey(process.env.CREATOR_KEYFILE!, process.env.CREATOR_PASSWORD!),
        getPrivateKey(process.env.MINTER_KEYFILE!, process.env.MINTER_PASSWORD!),
        getPrivateKey(process.env.BUYER_KEYFILE!, process.env.BUYER_PASSWORD!),
      ],
      config[network].nvm.nodeUri
    )
  } else {
    hdWalletProvider = new HDWalletProvider(
      config[network].seed!,
      config[network].nvm.nodeUri,
      0,
      3
    )
  }


  return {
    ...config[network],
    nvm: {
      ...config[network].nvm,
      web3Provider: hdWalletProvider
    }
  };
}

function getPrivateKey(keyfilePath: string, password: string): string {
  const w3 = new Web3()
  const data = fs.readFileSync(keyfilePath)
  const keyfile = JSON.parse(data.toString())

  return w3.eth.accounts.decrypt(keyfile, password).privateKey
}
