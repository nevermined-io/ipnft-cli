import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined,
  uploadFile
} from "../../utils";
import chalk from "chalk";
import { File } from "@nevermined-io/nevermined-sdk-js";
import fs from 'fs';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export const updateNft = async (argv: any): Promise<number> => {
  const { verbose, network, did, creator, file } = argv;

  console.log(chalk.dim(`Updating NFT data ...`));

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const accounts = await nvm.accounts.list();
  let creatorAccount = findAccountOrFirst(accounts, creator);

  if (verbose)
    console.log(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`));

  const ddo = await nvm.assets.resolve(did);

  const url = await uploadFile(config, file)
  
  console.log(`Uploaded to ${url}`)

  const metadata = ddo.findServiceByType("metadata").attributes;
  metadata.main.files = [{url, contentType: ''}]

  const encryptedFilesResponse = await nvm.gateway.encrypt(
    ddo.id,
    JSON.stringify(metadata.main.files),
    'PSK-RSA'
  )
  metadata.encryptedFiles = JSON.parse(encryptedFilesResponse)['hash']
  metadata.main.dateCreated = new Date().toISOString().replace(/\.[0-9]{3}/, "")

  metadata.main.files = [{contentType: '', index: 0} as File]
  ddo.created = new Date().toISOString().replace(/\.[0-9]{3}/, "")
  await nvm.metadata.updateDDO(did, ddo)
  console.log('Updated DDO')

  return StatusCodes.OK;
};
