import { Contract } from "web3-eth-contract";
import Web3Provider from "@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider";
import abi from "../abis/ERC721URIStorage.json";
import { noZeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

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
