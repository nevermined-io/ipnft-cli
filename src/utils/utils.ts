import { Contract } from "web3-eth-contract";
import Web3Provider from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider";
import ERC721 from "../abis/ERC721URIStorage.json";
import {
  generateId,
  noZeroX,
  zeroX,
} from "@nevermined-io/nevermined-sdk-js/dist/node/utils";
import { Account, Config, Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import { Constants, StatusCodes } from "./enums";
import { ConfigEntry } from "./config";
import { AbiItem } from "web3-utils";
import Token from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/Token";
import CustomToken from "./CustomToken";

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

export const prepareNFTSaleAgreement = async ({
  nvm,
  token,
  nftContractAddress,
  did,
  buyer,
  agreementId = zeroX(generateId()),
  receiver,
  price = 0,
}: {
  nvm: Nevermined;
  token: Token | null;
  nftContractAddress: string;
  did: string;
  buyer: string;
  receiver: string;
  agreementId?: string;
  price?: number;
}) => {
  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals;

  price = price * 10 ** decimals;

  const {
    escrowPaymentCondition,
    lockPaymentCondition,
    transferNft721Condition,
  } = nvm.keeper.conditions;

  const conditionIdLockPayment = await lockPaymentCondition.generateId(
    agreementId,
    await lockPaymentCondition.hashValues(
      did,
      escrowPaymentCondition.address,
      token !== null ? token.address : Constants.ZeroAddress,
      [price],
      [receiver]
    )
  );

  const conditionIdTransferNFT = await transferNft721Condition.generateId(
    agreementId,
    await transferNft721Condition.hashValues(
      did,
      buyer,
      1,
      conditionIdLockPayment,
      nftContractAddress
    )
  );

  const conditionIdEscrow = await escrowPaymentCondition.generateId(
    agreementId,
    await escrowPaymentCondition.hashValues(
      did,
      [price],
      [receiver],
      escrowPaymentCondition.address,
      token !== null ? token.address : Constants.ZeroAddress,
      conditionIdLockPayment,
      conditionIdTransferNFT
    )
  );

  const nftSalesAgreement: {
    did: string;
    conditionIds: string[];
    timeLocks: number[];
    timeOuts: number[];
    accessConsumer: string;
  } = {
    did: did,
    conditionIds: [
      conditionIdLockPayment,
      conditionIdTransferNFT,
      conditionIdEscrow,
    ],
    timeLocks: [0, 0, 0],
    timeOuts: [0, 0, 0],
    accessConsumer: buyer,
  };

  return {
    agreementId,
    nftSalesAgreement,
  };
};

export async function prepareNFTAccessAgreement({
  nvm,
  nftContractAddress,
  did,
  agreementId = zeroX(generateId()),
  holder,
  accessor,
}: {
  nvm: Nevermined;
  nftContractAddress: string;
  did: string;
  agreementId?: string;
  holder: string;
  accessor: string;
}) {
  const { nft721HolderCondition, nftAccessCondition } = nvm.keeper.conditions;

  // construct agreement
  const nftHolderConditionId = await nft721HolderCondition.generateId(
    agreementId,
    await nft721HolderCondition.hashValues(did, holder, 1, nftContractAddress)
  );
  const nftAccessConditionId = await nftAccessCondition.generateId(
    agreementId,
    await nftAccessCondition.hashValues(did, accessor)
  );

  const nftAccessAgreement = {
    did: did,
    conditionIds: [nftHolderConditionId, nftAccessConditionId],
    timeLocks: [0, 0],
    timeOuts: [0, 0],
    accessConsumer: accessor,
  };

  return {
    agreementId,
    nftAccessAgreement,
  };
}

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
      console.log(chalk.red(`ERROR: '${address}' is not an account!`));
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
    nftContract.methods.owner().call(),
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
    token.totalSupply(),
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

export const loadNevermined = async (
  config: ConfigEntry,
  network: string,
  verbose: boolean = false
): Promise<{ token: Token | null; nvm: Nevermined }> => {
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(
      chalk.red(`ERROR: Nevermined could not connect to '${network}'`)
    );
  }

  // default to no token
  let token: Token | null = null;

  if (
    config.erc20TokenAddress.toLowerCase() ===
    Constants.ZeroAddress.toLowerCase()
  ) {
    // sorry not supported now
    console.log(chalk.red("ERROR: Assuming Payments in ETH!"));
    throw new Error("Payments in ETH are not supported by the SDK by now!");
  } else {
    // if the token address is not zero try to load it
    token = nvm.keeper.token;

    // check if we have a different token configured
    if (
      config.erc20TokenAddress.toLowerCase() !==
      nvm.keeper.token.address.toLowerCase()
    ) {
      console.log(
        chalk.yellow(
          `WARNING: Using custom ERC20 Token at address '${config.erc20TokenAddress}'!`
        )
      );

      token = await CustomToken.getInstanceByAddress(
        {
          nevermined: nvm,
          web3: Web3Provider.getWeb3(config.nvm),
        },
        config.erc20TokenAddress
      );
    }

    if (verbose) await printErc20TokenBanner(token);
  }

  return {
    nvm,
    token,
  };
};
