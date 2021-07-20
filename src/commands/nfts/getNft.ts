import { StatusCodes, getConfig, formatDid, loadNftContract, Constants } from "../../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const getNft = async (argv: any): Promise<number> => {
  const { verbose, network, did } = argv;

  const did0x = zeroX(did);

  if (verbose) console.log(`Loading information for did: '${did0x}'`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = loadNftContract(config);

  const [contractTokenUri, contractTokenOwner] = await Promise.all([
    nft.methods.tokenURI(did0x).call(),
    nft.methods.ownerOf(did0x).call(),
  ]);

  const nvmDid = formatDid(did0x);
  const { owner, url } = (await nvm.keeper.didRegistry.getDIDRegister(
    nvmDid
  )) as { owner: string; url: string };

  console.log(chalk.dim(`====== ${chalk.whiteBright("Nevermined")} ======`));
  console.log(chalk.dim(`====== ${chalk.whiteBright(nvmDid)} ======`));
  console.log(chalk.dim(`Url: ${chalk.whiteBright(url)}`));
  console.log(chalk.dim(`Owner: ${chalk.whiteBright(owner)}`));

  console.log("\n");

  console.log(
    chalk.dim(`====== ${chalk.whiteBright("Token Contract")} ======`)
  );
  console.log(chalk.dim(`====== ${chalk.whiteBright(did0x)} ======`));
  console.log(chalk.dim(`Url: ${chalk.whiteBright(contractTokenUri)}`));
  console.log(chalk.dim(`Owner: ${chalk.whiteBright(contractTokenOwner)}`));

  console.log("\n");

  return StatusCodes.OK;
};
