import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  prepareNFTAccessAgreement,
  printNftTokenBanner,
  loadNevermined,
} from "../../utils";
import chalk from "chalk";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const createAccessAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, did, holder, accessor } = argv;

  const did0x = zeroX(did);

  if (verbose)
    console.log(
      chalk.dim(
        `Creating access agreement for DID: '${chalk.whiteBright(did0x)}'`
      )
    );

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();
  const holderAccount = findAccountOrFirst(accounts, holder);

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(did0x)}'`));
    console.log(
      chalk.dim(`Holder: '${chalk.whiteBright(holderAccount.getId())}'`)
    );
    console.log(chalk.dim(`Accessor: '${chalk.whiteBright(accessor)}'`));
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const owner = await nft.methods.ownerOf(did).call();

  if (holderAccount.getId().toLowerCase() !== owner.toLowerCase()) {
    console.log(
      chalk.red(`'${holderAccount.getId()}' is not owner of '${did}'!`)
    );
    return StatusCodes.HOLDER_NOT_OWNER;
  }

  const { nft721AccessTemplate } = nvm.keeper.templates;

  const { agreementId, nftAccessAgreement } = await prepareNFTAccessAgreement({
    nvm,
    nftContractAddress: nft.options.address,
    did,
    holder: holderAccount.getId(),
    accessor,
  });

  console.log(
    chalk.dim(
      `Agreement '${chalk.whiteBright(
        agreementId
      )}' for did '${chalk.whiteBright(nftAccessAgreement.did)}' prepared!`
    )
  );

  const { transactionHash } = await nft721AccessTemplate.createAgreement(
    agreementId,
    nftAccessAgreement.did,
    nftAccessAgreement.conditionIds,
    nftAccessAgreement.timeLocks,
    nftAccessAgreement.timeOuts,
    nftAccessAgreement.accessConsumer,
    holderAccount.getId()
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
