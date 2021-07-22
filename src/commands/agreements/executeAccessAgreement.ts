import {
  StatusCodes,
  getConfig,
  findAccountOrFirst,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner,
} from "../../utils";
import { ConditionState } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";

export const executeAccessAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId, holder, accessor } = argv;

  if (verbose)
    console.log(
      chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
    );

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const { conditionStoreManager, agreementStoreManager } = nvm.keeper;
  const accounts = await nvm.accounts.list();
  const holderAccount = findAccountOrFirst(accounts, holder);

  const { did, conditionIds } = await agreementStoreManager.getAgreement(
    agreementId
  );

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did)}'`));
    console.log(
      chalk.dim(`Holder: '${chalk.whiteBright(holderAccount.getId())}'`)
    );
    console.log(chalk.dim(`Accessor: '${chalk.whiteBright(accessor)}'`));
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const status = StatusCodes.OK;

  {
    const conditionId = conditionIds[0];
    const { state } = await conditionStoreManager.getCondition(conditionId);

    if (state !== ConditionState.Fulfilled) {
      if (verbose) console.log(chalk.dim("Fulfilling Holder Condition"));

      await nvm.agreements.conditions.holderNft721(
        agreementId,
        did,
        holderAccount.getId(),
        nft.options.address,
        1,
        holderAccount
      );

      const { state } = await conditionStoreManager.getCondition(conditionId);

      console.log(
        chalk.dim(
          `Holder Condition is now: ${chalk.whiteBright(ConditionState[state])}`
        )
      );
    } else {
      console.log(chalk.yellow("Holder Condition already fulfilled!"));
    }
  }

  {
    const conditionId = conditionIds[1];
    const { state } = await conditionStoreManager.getCondition(conditionId);

    if (state !== ConditionState.Fulfilled) {
      if (verbose) console.log(chalk.dim("Fulfilling Access Condition"));

      await nvm.agreements.conditions.grantNftAccess(
        agreementId,
        did,
        accessor,
        holderAccount.getId()
      );

      const { state } = await conditionStoreManager.getCondition(conditionId);

      console.log(
        chalk.dim(
          `Access Condition is now: ${chalk.whiteBright(ConditionState[state])}`
        )
      );
    } else {
      console.log(chalk.yellow("Access Condition already fulfilled!"));
    }
  }

  return status;
};
