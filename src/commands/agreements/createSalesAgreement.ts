import {
  StatusCodes,
  getConfig,
  loadNftContract,
  prepareNFTSaleAgreement,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined,
} from "../../utils";
import chalk from "chalk";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const createSalesAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, did, price, buyer, seller } = argv;

  const did0x = zeroX(did);

  if (verbose)
    console.log(
      chalk.dim(
        `Creating sales agreement for DID: '${chalk.whiteBright(did0x)}'`
      )
    );

  const config = getConfig(network as string);
  const { nvm, token } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();
  const sellerAccount = findAccountOrFirst(accounts, seller);

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did0x)}'`));
    console.log(
      chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
    );
    console.log(chalk.dim(`Buyer: '${chalk.whiteBright(buyer)}'`));
    console.log(chalk.dim(`Price: '${chalk.whiteBright(price)}'`));
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const owner = await nft.methods.ownerOf(did).call();

  if (sellerAccount.getId().toLowerCase() !== owner.toLowerCase()) {
    console.log(
      chalk.red(`'${sellerAccount.getId()}' is not owner of '${did}'!`)
    );
    return StatusCodes.SELLER_NOT_OWNER;
  }

  const { nft721SalesTemplate } = nvm.keeper.templates;

  const { agreementId, nftSalesAgreement } = await prepareNFTSaleAgreement({
    nvm,
    token,
    nftContractAddress: nft.options.address,
    did,
    receiver: sellerAccount.getId(),
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
