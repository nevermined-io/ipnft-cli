import { StatusCodes, getConfig, loadNftContract } from "../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import utils from "web3-utils";
import { generateId } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

const royalties = 10; // 10% of royalties in the secondary market
const cappedAmount = 5;

export const mint = async (argv: any): Promise<number> => {
  const { verbose, network, id, url, to, minter } = argv;

  if (verbose) console.log(`Ninting NFT: ${id} ${url} to ${to}`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(chalk.red(`Nevermined could not connect to ${network}`));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  let minterAccount;

  if (minter) {
    minterAccount = accounts.find(
      (a) => a.getId().toLowerCase() === minter.toLowerCase()
    );

    if (!minterAccount) {
      console.log(chalk.red(`Minter is not an account!`));
      return StatusCodes.MINTER_NOT_AN_ACCOUNT;
    }
  } else {
    minterAccount = accounts[0];
  }

  const { didRegistry } = nvm.keeper;

  if (verbose) console.log(`Using minter: ${minterAccount.getId()}`);

  const hexId = utils.toHex(id as string);
  const did = await didRegistry.hashDID(hexId, to);

  const nft = await loadNftContract(config);

  const contractOwner: string = await nft.methods.owner().call();

  if (contractOwner.toLowerCase() !== minterAccount.getId().toLowerCase()) {
    console.log(
      chalk.red(
        `Account ${minterAccount.getId()} is not the owner of the contract but ${contractOwner} is`
      )
    );
    return StatusCodes.MINTER_NOT_OWNER;
  }

  console.log(`Registering NFT: '${id}'`);

  const { owner } = (await didRegistry.getDIDRegister(did)) as {
    owner: string;
  };

  if (owner !== "0x0000000000000000000000000000000000000000") {
    console.log(chalk.red("DID already registered!"));
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

    console.log(`DID: '${did}' registered!`);
  }

  console.log(`Minting NFT!`);

  try {
    const oldOwner = await nft.methods.ownerOf(did).call();
    console.log(chalk.red(`NFT already existing and owned by: ${oldOwner}`));
    return StatusCodes.NFT_ALREADY_OWNED;
  } catch {
  }

  await nft.methods
    .mint(to, did, url as string)
    .send({ from: minterAccount.getId() });

  console.log(`NFT '${id}' minted!`);

  return StatusCodes.OK;
};