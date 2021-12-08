import { getConfig, loadNevermined, StatusCodes } from "../../utils";
import chalk from "chalk";

export const accountsFund = async (argv: any): Promise<number> => {
  console.log(argv)
  const { verbose, network, account, gasMultiplier } = argv;

  if (verbose)
    console.log(chalk.dim(`Funding account: '${chalk.whiteBright(account)}'`));

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  try {
    await nvm.faucet.requestEth(account);
    console.log(chalk.dim(`Funded ETH to ${chalk.whiteBright(account)}`));
  } catch (err) {
    console.log(
      chalk.red(
        `Funding ETH to ${chalk.whiteBright(account)} failed! ${err.message}`
      )
    );

    if (verbose) console.log(err);
  }

  try {
    await nvm.keeper.dispenser.requestTokens(100, account, {gasMultiplier});
    console.log(chalk.dim(`Funded Tokens to ${chalk.whiteBright(account)}`));
  } catch (err) {
    console.log(
      chalk.red(
        `Funding Tokens to ${chalk.whiteBright(account)} failed! ${err.message}`
      )
    );
    if (verbose) console.log(err);
  }

  return StatusCodes.OK;
};
