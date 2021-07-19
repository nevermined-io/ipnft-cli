import { StatusCodes, getConfig, formatDid, loadNftContract } from "../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";

export const getNft = async (argv: any): Promise<number> => {
  const { verbose, network, did } = argv;

  if (verbose) console.log(`Loading information for did: ${did}`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(chalk.red(`Nevermined could not connect to ${network}`));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = await loadNftContract(config);

  const [contractTokenUri, contractTokenOwner] = await Promise.all([
    nft.methods.tokenURI(did).call(),
    nft.methods.ownerOf(did).call(),
  ]);

  const nvmDid = formatDid(did);
  const { owner, url } = (await nvm.keeper.didRegistry.getDIDRegister(
    nvmDid
  )) as { owner: string; url: string };

  console.log(chalk.dim(`====== Nevermined ======`));
  console.log(chalk.dim(`====== ${nvmDid} ======`));
  console.log(chalk.gray(`Url: ${url}`));
  console.log(chalk.gray(`Owner: ${owner}`));

  console.log("\n");

  console.log(chalk.dim(`====== Token Contract ======`));
  console.log(chalk.dim(`====== ${did} ======`));
  console.log(chalk.gray(`Url: ${contractTokenUri}`));
  console.log(chalk.gray(`Owner: ${contractTokenOwner}`));

  console.log("\n");

  return StatusCodes.OK;
};
