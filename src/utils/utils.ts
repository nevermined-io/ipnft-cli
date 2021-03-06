import { Contract } from "web3-eth-contract";
import Web3Provider from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider";
import { noZeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";
import { Account, Config, Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import Token from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/Token";
import ERC721 from "../abis/ERC721URIStorage.json";
import { Constants, StatusCodes } from "./enums";
import { ConfigEntry } from "./config";
import { AbiItem } from "web3-utils";
import CustomToken from "./CustomToken";
import { TxParameters } from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/ContractBase";
import axios from 'axios';
import fs from 'fs';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const loadContract = (
  config: Config,
  abi: AbiItem[] | AbiItem,
  address: string
): Contract => {
  const web3 = Web3Provider.getWeb3(config);
  web3.setProvider(config.web3Provider);

  // @ts-ignore
  const contract = new web3.eth.Contract(abi, address);

  return contract;
};

export const loadNftContract = (config: ConfigEntry): Contract => {
  // @ts-ignore
  return loadContract(config.nvm, ERC721, config.nftTokenAddress);
};

export const formatDid = (did: string): string => {
  return `did:nv:${noZeroX(did)}`;
};

export const findAccountOrFirst = (
  accounts: Account[],
  address: string
): Account => {
  let account: Account | undefined = accounts[0]!;

  if (address) {
    account = accounts.find(
      (a: Account) => a.getId().toLowerCase() === address.toLowerCase()
    );

    if (!account) {
      console.log(chalk.red(`ERROR: '${address}' is not an account!\n`));
      throw new Error(`${StatusCodes[StatusCodes.ADDRESS_NOT_AN_ACCOUNT]}`);
    }
  }

  return account!;
};

export const printNftTokenBanner = async (nftContract: Contract) => {
  const { address } = nftContract.options;

  const [name, symbol, owner] = await Promise.all([
    nftContract.methods.name().call(),
    nftContract.methods.symbol().call(),
    nftContract.methods.owner().call()
  ]);

  console.log("\n");
  console.log(chalk.dim(`===== NFT Contract =====`));
  console.log(chalk.dim(`Address: ${chalk.whiteBright(address)}`));
  console.log(chalk.dim(`Name: ${chalk.whiteBright(name)}`));
  console.log(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`));
  console.log(chalk.dim(`Owner: ${chalk.whiteBright(owner)}`));
  console.log("\n");
};

export const printErc20TokenBanner = async (token: Token) => {
  const { address } = token;

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply()
  ]);

  console.log("\n");
  console.log(chalk.dim(`===== ERC20 Contract =====`));
  console.log(chalk.dim(`Address: ${chalk.whiteBright(address)}`));
  console.log(chalk.dim(`Name: ${chalk.whiteBright(name)}`));
  console.log(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`));
  console.log(chalk.dim(`Decimals: ${chalk.whiteBright(decimals)}`));
  console.log(
    chalk.dim(
      `Total Supply: ${chalk.whiteBright(totalSupply / 10 ** decimals)}`
    )
  );
};

export const uploadFile = async (config: ConfigEntry, file: string) : Promise<string> => {
  const s3 = new AWS.S3({
    ...config.s3,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4'
  });

  const bucket = 'bucket-' + uuidv4()

  await s3.createBucket({Bucket: bucket}).promise()

  const readOnlyAnonUserPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AddPerm",
        Effect: "Allow",
        Principal: "*",
        Action: [
          "s3:GetObject"
        ],
        Resource: [
          "arn:aws:s3:::" + bucket + "/*"
        ]
      }
    ]
  };
  
  // convert policy JSON into string and assign into params
  const bucketPolicyParams = {Bucket: bucket, Policy: JSON.stringify(readOnlyAnonUserPolicy)};
  
  // set the new policy on the selected bucket
  await s3.putBucketPolicy(bucketPolicyParams).promise()

  var fileStream = fs.createReadStream(file);
  fileStream.on('error', function(err) {
    console.log('File Error', err);
  });

  const uploadParams = {Bucket: bucket, Key: `file-${uuidv4()}`, Body: fileStream}

  let res = await s3.upload(uploadParams).promise()
  return res.Location
}

export const getTxParams = (argv: any) : TxParameters => {
  let apikey = process.env['ETHERSCANAPIKEY']
  let { gasMultiplier, gas, verbose, gasPrice } = argv;
  let shortProgress = async (a:any) => {
    if (a.stage === 'sent') {
      console.log(`Sending TX ${a.contractName}.${a.method} with ${a.gas} gas`)
    } else if (a.stage === 'txHash') {
      console.log(`Got TX hash for ${a.contractName}.${a.method}: ${a.txHash}`)
      let res = await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${a.gasPrice}&apikey=${apikey}`,
      )
      console.log(`Estimated confirmation time: ${res.data.result} seconds`)
    } else if (a.stage === 'receipt') {
      console.log(`Got TX receipt for ${a.contractName}.${a.method} with hash ${a.receipt.transactionHash}`)
    }
  }
  let printProgress = (a:any) => {
    console.log(a)
  }
  return {
    gasMultiplier,
    gasPrice,
    progress: verbose ? printProgress : shortProgress,
    gas
  } 
}

export const loadNevermined = async (
  config: ConfigEntry,
  network: string,
  verbose: boolean = false
): Promise<{ token: Token | null; nvm: Nevermined }> => {
  const nvm = await Nevermined.getInstance({
    ...config.nvm,
    verbose: verbose ? verbose : config.nvm.verbose
  });

  if (!nvm.keeper) {
    console.log(
      chalk.red(`ERROR: Nevermined could not connect to '${network}'\n`)
    );
  }

  // default to no token
  let token: Token | null = null;

  if (
    config.erc20TokenAddress.toLowerCase() ===
    Constants.ZeroAddress.toLowerCase()
  ) {
    // sorry not supported now
    console.log(chalk.red("WARNING: Assuming Payments in ETH!\n"));
  } else {
    // if the token address is not zero try to load it
    token = nvm.keeper.token;

    // check if we have a different token configured
    if (
      config.erc20TokenAddress.toLowerCase() !==
      (token.address && token.address.toLowerCase())
    ) {
      token = await CustomToken.getInstanceByAddress(
        {
          nevermined: nvm,
          web3: Web3Provider.getWeb3(config.nvm)
        },
        config.erc20TokenAddress
      );
    } else {
      console.log(
        chalk.yellow(
          `WARNING: Using nevermined token '${config.erc20TokenAddress}'!\n`
        )
      );
    }

    if (verbose) await printErc20TokenBanner(token);
  }

  return {
    nvm,
    token
  };
};
