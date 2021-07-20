import {
  StatusCodes,
  getConfig,
  loadNftContract,
  prepareNFTSaleAgreement,
  Constants,
} from "../../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const createSalesAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, did, price, buyer, seller } = argv;

  const did0x = zeroX(did);

  if (verbose) console.log(`Creating sale agreement for DID: '${did0x}'`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  let sellerAccount;

  if (seller) {
    sellerAccount = accounts.find(
      (a) => a.getId().toLowerCase() === seller.toLowerCase()
    );

    if (!sellerAccount) {
      console.log(chalk.red(`ERROR: Buyer is not an account!`));
      return StatusCodes.BUYER_NOT_AN_ACCOUNT;
    }
  } else {
    sellerAccount = accounts[0];
  }

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did0x)}'`));
    console.log(chalk.dim(`Price: '${chalk.whiteBright(price)}'`));
    console.log(chalk.dim(`Buyer: '${chalk.whiteBright(buyer)}'`));
    console.log(
      chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
    );
  }

  const nft = loadNftContract(config);

  const { nft721SalesTemplate } = nvm.keeper.templates;

  const { agreementId, nftSalesAgreement } = await prepareNFTSaleAgreement({
    nvm,
    nftContractAddress: nft.options.address,
    did,
    receiver: await nft.methods.ownerOf(did).call(),
    buyer,
    price,
  });

  console.log(
    chalk.dim(
      `Agreement '${chalk.whiteBright(
        agreementId
      )}' for did '${chalk.whiteBright(nftSalesAgreement.did)}' prepared!`
    )
  );

  const { transactionHash } = await nft721SalesTemplate.createAgreement(
    agreementId,
    nftSalesAgreement.did,
    nftSalesAgreement.conditionIds,
    nftSalesAgreement.timeLocks,
    nftSalesAgreement.timeOuts,
    nftSalesAgreement.accessConsumer,
    sellerAccount.getId()
  );

  console.log(
    chalk.dim(
      `Agreement '${chalk.whiteBright(
        agreementId
      )}' created at transaction '${chalk.whiteBright(transactionHash)}'!`
    )
  );

  return StatusCodes.OK;
};
