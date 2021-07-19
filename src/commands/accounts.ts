import { getConfig, loadNftContract, StatusCodes } from "../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import utils from "web3-utils";

export const accounts = async (argv: any): Promise<number> => {
  const { verbose, network, withInventory } = argv;

  if (verbose) console.log(`Loading accounts`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(chalk.red(`Nevermined could not connect to ${network}`));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  const nft = loadNftContract(config);

  const loadedAccounts = await Promise.all(
    accounts.map(async (a, index) => {
      return {
        index,
        id: a.getId(),
        ethBalance: utils.fromWei(
          (await a.getEtherBalance()).toString(),
          "ether"
        ),
        url: `${config.etherscanUrl}/token/${config.nftTokenAddress}`,
        nftBalance: await nft.methods.balanceOf(a.getId()).call(),
        tokenUrl: `${config.etherscanUrl}/address/${a.getId()}`,
        inventory: withInventory
          ? await Promise.all(
              (
                await nft.getPastEvents("Transfer", {
                  fromBlock: 0,
                  toBlock: "latest",
                  filter: {
                    to: a.getId(),
                  },
                })
              ).map(async (l) => {
                // check if the account is still the owner
                if (
                  ((await nft.methods
                    .ownerOf(l.returnValues.tokenId)
                    .call()) as string).toLowerCase() ===
                  a.getId().toLowerCase()
                ) {
                  return {
                    block: l.blockNumber,
                    tokenId: l.returnValues.tokenId,
                    url: `${config.etherscanUrl}/token/${config.nftTokenAddress}?a=${l.returnValues.tokenId}#inventory`,
                  };
                }
              })
            )
          : [],
      };
    })
  );

  for (const a of loadedAccounts) {
    console.log(chalk.dim(`===== Account ${a.index + 1} =====`));
    console.log(chalk.gray(`Address: ${a.id}`));
    console.log(chalk.gray(`ETH Balance: ${a.ethBalance}`));
    console.log(chalk.gray(`Etherscan Url: ${a.url}`));
    console.log(chalk.gray(`NFT Balance: ${a.nftBalance}`));

    if (a.inventory.length > 0) {
      console.log(chalk.dim(`\nInventory:`));
      for (const inv of a.inventory) {
        console.log(chalk.dim(`===== NFT ${inv!.tokenId} =====`));
        console.log(chalk.dim(`Received at block: ${inv!.block}`));
        console.log(chalk.dim(`Etherscan Url: ${inv!.url}`));
      }
    }

    console.log("\n");
  }

  return StatusCodes.OK;
};
