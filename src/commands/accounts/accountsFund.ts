import { Constants, getConfig, StatusCodes } from "../../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";

export const accountsFund = async (argv: any): Promise<number> => {
  const { verbose, network, account } = argv;

  if (verbose)
    console.log(chalk.dim(`Funding account: '${chalk.whiteBright(account)}'`));

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
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
    await nvm.keeper.dispenser.requestTokens(100, account);
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