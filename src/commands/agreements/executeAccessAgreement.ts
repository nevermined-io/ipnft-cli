import {
  StatusCodes,
  getConfig,
  Constants,
  findAccountOrFirst,
  loadNevermined,
} from "../../utils";
import { ConditionState, Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";

export const executeAccessAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId, seller, price, buyer } = argv;

  if (verbose)
    console.log(
      chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
    );

  const config = getConfig(network as string);
  const { nvm, token } = await loadNevermined(config, network);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const { conditionStoreManager, agreementStoreManager } = nvm.keeper;

  const { did, conditionIds } = await agreementStoreManager.getAgreement(
    agreementId
  );

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals;

  const priceInWei = price * 10 ** decimals;

  const {
    lockPaymentCondition,
    escrowPaymentCondition,
  } = nvm.keeper.conditions;

  const accounts = await nvm.accounts.list();

  let buyerAccount = findAccountOrFirst(accounts, buyer);

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did)}'`));
    console.log(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`));
    console.log(chalk.dim(`Seller: '${chalk.whiteBright(seller)}'`));
    console.log(
      chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`)
    );
    console.log(chalk.dim(`Price: '${chalk.whiteBright(price)}'`));
  }

  const { state } = await conditionStoreManager.getCondition(conditionIds[0]);

  if (state !== ConditionState.Fulfilled) {
    if (token !== null) {
      await token.approve(
        lockPaymentCondition.address,
        priceInWei,
        buyerAccount.getId()
      );
    }

    await lockPaymentCondition.fulfill(
      agreementId,
      did,
      escrowPaymentCondition.address,
      // use zero address if payments are in ETH
      token !== null ? token.address : Constants.ZeroAddress,
      [priceInWei],
      [seller],
      buyerAccount.getId()
    );

    const { state } = await conditionStoreManager.getCondition(conditionIds[0]);

    console.log(
      chalk.dim(
        `Payment Condition is now: ${chalk.whiteBright(ConditionState[state])}`
      )
    );
  } else {
    console.log(chalk.yellow("Payment Condition already fulfilled!"));
    return StatusCodes.INCONCLUSIVE;
  }

  return StatusCodes.OK;
};
