import {
  StatusCodes,
  getConfig,
  loadNftContract,
  Constants,
  findAccountOrFirst,
  printNftTokenBanner, loadNevermined
} from "../../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import utils from "web3-utils";
import { generateId } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

// todo make this configurable
const royalties = 10; // 10% of royalties in the secondary market
const cappedAmount = 1;

export const mintNft = async (argv: any): Promise<number> => {
  const { verbose, network, id, url, to, minter } = argv;

  if (verbose)
    console.log(
      chalk.dim(
        `Minting NFT: '${chalk.whiteBright(id)}' '${chalk.whiteBright(
          url
        )}' to '${chalk.whiteBright(to)}'`
      )
    );

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  let minterAccount = findAccountOrFirst(accounts, minter);

  const { didRegistry } = nvm.keeper;

  if (verbose)
    console.log(chalk.dim(`Using minter: '${minterAccount.getId()}'`));

  const hexId = utils.toHex(id as string);
  const did = await didRegistry.hashDID(hexId, to);

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const contractOwner: string = await nft.methods.owner().call();

  if (contractOwner.toLowerCase() !== minterAccount.getId().toLowerCase()) {
    console.log(
      chalk.red(
        `ERROR: Account '${minterAccount.getId()}' is not the owner of the contract but '${contractOwner}' is`
      )
    );
    return StatusCodes.MINTER_NOT_OWNER;
  }

  console.log(
    chalk.dim(`Registering NFT: '${chalk.whiteBright(id)}' in Nevermined!)`)
  );

  const { owner } = (await didRegistry.getDIDRegister(did)) as {
    owner: string;
  };

  if (owner !== Constants.ZeroAddress) {
    console.log(chalk.red("ERROR: DID already registered!"));
  } else {
    await didRegistry.registerMintableDID(
      hexId,
      generateId(),
      [],
      url as string,
      "0x1",
      "",
      cappedAmount,
      royalties,
      to
    );

    console.log(
      chalk.dim(`DID '${chalk.whiteBright(did)}' registered in Nevermined!`)
    );
  }

  console.log(chalk.dim(`Minting NFT!`));

  try {
    const oldOwner = await nft.methods.ownerOf(did).call();
    console.log(
      chalk.red(`ERROR: NFT already existing and owned by: '${oldOwner}'`)
    );
    return StatusCodes.NFT_ALREADY_OWNED;
  } catch {}

  await nft.methods
    .mint(to, did, url as string)
    .send({ from: minterAccount.getId() });

  console.log(
    chalk.dim(
      `NFT '${chalk.whiteBright(id)}' minted to '${chalk.whiteBright(to)}'!`
    )
  );

  return StatusCodes.OK;
};
