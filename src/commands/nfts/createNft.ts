import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined,
  Constants
} from "../../utils";
import chalk from "chalk";
import { MetaDataMain, File } from "@nevermined-io/nevermined-sdk-js";
import AssetRewards from "@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const createNft = async (argv: any): Promise<number> => {
  const { verbose, network, creator } = argv;

  console.log(chalk.dim(`Creating NFT ...`));

  const config = getConfig(network as string);
  const { nvm, token } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const accounts = await nvm.accounts.list();
  let creatorAccount = findAccountOrFirst(accounts, creator);

  if (verbose)
    console.log(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`));

  const authorInput = await new Promise(resolve =>
    rl.question("Author Name: ", author => {
      resolve(author);
    })
  );

  const name = await new Promise(resolve =>
    rl.question("Asset Name: ", name => {
      resolve(name);
    })
  );

  const url = await new Promise(resolve =>
    rl.question("URL to the Asset: ", url => {
      resolve(url);
    })
  );

  const price: number = await new Promise(resolve =>
    rl.question("Price of the Asset: ", price => {
      resolve(Number(price));
    })
  );

  const license = await new Promise(resolve =>
    rl.question("License of the Asset: ", license => {
      resolve(license);
    })
  );

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals;

  console.log(chalk.dim("\nCreating Asset ..."));

  const ddo = await nvm.nfts.create721(
    {
      main: {
        name,
        type: "dataset",
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ""),
        author: authorInput,
        license,
        files: [
          {
            url
          } as File
        ]
      } as MetaDataMain
    },
    creatorAccount,
    new AssetRewards(creatorAccount.getId(), price * 10 ** decimals),
    config.nftTokenAddress,
    token ? token.getAddress() : config.erc20TokenAddress
  );

  const metadata = ddo.findServiceByType("metadata");

  console.log(
    chalk.dim(
      `Created NFT '${chalk.whiteBright(ddo.id)}' for: '${chalk.whiteBright(
        url
      )}' with service endpoint: ${chalk.whiteBright(metadata.serviceEndpoint)}`
    )
  );

  console.log("Now please mint the token on the NFT Contract!");

  return StatusCodes.OK;
};
