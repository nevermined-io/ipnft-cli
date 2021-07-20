import chalk from "chalk";

export enum StatusCodes {
  UNKNOWN = -999,
  ERROR = -1,
  OK = 0,
  MINTER_NOT_OWNER,
  FAILED_TO_CONNECT,
  MINTER_NOT_AN_ACCOUNT,
  NFT_ALREADY_OWNED,
  BUYER_NOT_AN_ACCOUNT,
  ALREADY_DONE,
}

export const Constants = {
  ZeroAddress: "0x0000000000000000000000000000000000000000",
  ErrorNetwork(network: string) {
    return chalk.red(`ERROR: Nevermined could not connect to '${network}'`);
  },
};
