import { Contract } from "web3-eth-contract";
import Web3Provider from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider";
import abi from "../abis/ERC721URIStorage.json";
import {
  generateId,
  noZeroX,
} from "@nevermined-io/nevermined-sdk-js/dist/node/utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";

export const loadNftContract = (config: any): Contract => {
  const web3 = Web3Provider.getWeb3(config);
  web3.setProvider(config.nvm.web3Provider);

  // @ts-ignore
  const nft = new web3.eth.Contract(abi, config.nftTokenAddress);

  return nft;
};

export const formatDid = (did: string): string => {
  return `did:nv:${noZeroX(did)}`;
};

export const prepareNFTSaleAgreement = async ({
  nvm,
  nftContractAddress,
  did,
  buyer,
  agreementId = generateId(),
  receiver,
  price = 0,
}: {
  nvm: Nevermined;
  nftContractAddress: string;
  did: string;
  buyer: string;
  receiver: string;
  agreementId?: string;
  price?: number;
}) => {
  const { token } = nvm.keeper;

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
      token.address,
      [price],
      [receiver]
    )
  );

  const conditionIdTransferNFT = await transferNft721Condition.generateId(
    agreementId,
    await transferNft721Condition.hashValues(
      did,
      buyer,
      price,
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
      token.address,
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