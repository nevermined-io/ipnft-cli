import {
  StatusCodes,
  getConfig,
  loadNftContract,
  Constants,
} from "../../utils";
import { ConditionState, Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import utils from "web3-utils";

export const executeSalesAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId, price, seller, buyer } = argv;

  if (verbose)
    console.log(
      chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
    );

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const { token, conditionStoreManager, agreementStoreManager } = nvm.keeper;

  const { did, conditionIds } = await agreementStoreManager.getAgreement(
    agreementId
  );

  const {
    lockPaymentCondition,
    escrowPaymentCondition,
  } = nvm.keeper.conditions;

  const accounts = await nvm.accounts.list();

  let buyerAccount;

  if (buyer) {
    buyerAccount = accounts.find(
      (a) => a.getId().toLowerCase() === buyer.toLowerCase()
    );

    if (!buyerAccount) {
      console.log(chalk.red(`ERROR: Buyer is not an account!`));
      return StatusCodes.BUYER_NOT_AN_ACCOUNT;
    }
  } else {
    buyerAccount = accounts[0];
  }

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did)}'`));
    console.log(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`));
    console.log(chalk.dim(`Seller: '${chalk.whiteBright(seller)}'`));
    console.log(
      chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`)
    );
    console.log(chalk.dim(`Price: '${chalk.whiteBright(price)}'`));
  }

  const nft = loadNftContract(config);

  const { state } = await conditionStoreManager.getCondition(conditionIds[0]);

  if (state !== ConditionState.Fulfilled) {
    await token.approve(
      lockPaymentCondition.address,
      utils.toWei(price.toString(), "ether").toString(),
      buyerAccount.getId()
    );

    await lockPaymentCondition.fulfill(
      agreementId,
      did,
      escrowPaymentCondition.address,
      token.address,
      [price],
      [seller],
      buyerAccount.getId()
    );
  } else {
    console.log(chalk.yellow("LockPaymentCondition already fulfilled!"));
    return StatusCodes.ALREADY_DONE;
  }

  return StatusCodes.OK;
};
