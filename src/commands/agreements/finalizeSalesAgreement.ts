import {
  StatusCodes,
  getConfig,
  Constants,
  loadNftContract,
  findAccountOrFirst,
} from "../../utils";
import { ConditionState, Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";

export const finalizeSalesAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId, price, seller, buyer } = argv;

  if (verbose)
    console.log(
      chalk.dim(`Finalizing agreement: '${chalk.whiteBright(agreementId)}'`)
    );

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const { conditionStoreManager, agreementStoreManager, token } = nvm.keeper;
  const decimals = await token.decimals();
  const priceInWei = price * 10 ** decimals;

  const { did, conditionIds } = await agreementStoreManager.getAgreement(
    agreementId
  );

  const {
    transferNft721Condition,
    escrowPaymentCondition,
  } = nvm.keeper.conditions;

  const accounts = await nvm.accounts.list();

  let sellerAccount = findAccountOrFirst(accounts, seller);

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did)}'`));
    console.log(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`));
    console.log(
      chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
    );
    console.log(chalk.dim(`Buyer: '${chalk.whiteBright(buyer)}'`));
    console.log(chalk.dim(`Price: '${chalk.whiteBright(price)}'`));
  }

  let status = StatusCodes.OK;

  {
    const { state } = await conditionStoreManager.getCondition(conditionIds[1]);

    const nft = await loadNftContract(config);

    if (state !== ConditionState.Fulfilled) {
      if (verbose)
        console.log(
          chalk.dim("Setting Approval for the NFT Transfer Condition")
        );

      await nft.methods
        .setApprovalForAll(transferNft721Condition.address, true)
        .send({
          from: sellerAccount.getId(),
        });

      if (verbose) console.log(chalk.dim("Fulfilling NFT Transfer Condition"));

      await transferNft721Condition.fulfill(
        agreementId,
        did,
        buyer,
        1,
        conditionIds[0],
        nft.options.address,
        sellerAccount.getId()
      );

      await nft.methods
        .setApprovalForAll(transferNft721Condition.address, true)
        .send({
          from: sellerAccount.getId(),
        });

      if (verbose)
        console.log(
          chalk.dim("Removing Approval for the NFT Transfer Condition")
        );

      const { state } = await conditionStoreManager.getCondition(
        conditionIds[1]
      );

      console.log(
        chalk.dim(
          `Transfer Condition is now: ${chalk.whiteBright(
            ConditionState[state]
          )}`
        )
      );
    } else {
      console.log(chalk.yellow("Transfer Condition already fulfilled!"));
      status = StatusCodes.INCONCLUSIVE;
    }
  }

  {
    const { state } = await conditionStoreManager.getCondition(conditionIds[2]);

    if (state !== ConditionState.Fulfilled) {
      if (verbose) console.log(chalk.dim("Fulfilling Escrow Condition"));

      await escrowPaymentCondition.fulfill(
        agreementId,
        did,
        [priceInWei],
        [sellerAccount.getId()],
        escrowPaymentCondition.address,
        token.address,
        conditionIds[0],
        conditionIds[1],
        sellerAccount.getId()
      );

      const { state } = await conditionStoreManager.getCondition(
        conditionIds[2]
      );

      console.log(
        chalk.dim(
          `Escrow Condition is now: ${chalk.whiteBright(ConditionState[state])}`
        )
      );
    } else {
      console.log(chalk.yellow("Escrow Condition already fulfilled!"));
      status = StatusCodes.INCONCLUSIVE;
    }
  }

  return status;
};
