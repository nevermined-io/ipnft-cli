import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined
} from "../../utils";
import chalk from "chalk";
import { File } from "@nevermined-io/nevermined-sdk-js";
import readline from "readline";
import fs from 'fs';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  
  const s3 = new AWS.S3({
    accessKeyId: 'L70GX5Y60L73KUKH92KV' ,
    secretAccessKey: 'S4Qa6m9QM16TKvuVzImXaCfYG4JLgykMKDpp+5Zz' ,
    endpoint: 'http://127.0.0.1:9000' ,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4'
  });

  const bucket = 'bucket-' + uuidv4()

  await s3.createBucket({Bucket: bucket}).promise()

  const readOnlyAnonUserPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AddPerm",
        Effect: "Allow",
        Principal: "*",
        Action: [
          "s3:GetObject"
        ],
        Resource: [
          "arn:aws:s3:::" + bucket + "/*"
        ]
      }
    ]
  };
  
  // convert policy JSON into string and assign into params
  const bucketPolicyParams = {Bucket: bucket, Policy: JSON.stringify(readOnlyAnonUserPolicy)};
  
  // set the new policy on the selected bucket
  await s3.putBucketPolicy(bucketPolicyParams).promise()

  var fileStream = fs.createReadStream(file);
  fileStream.on('error', function(err) {
    console.log('File Error', err);
  });

  const uploadParams = {Bucket: bucket, Key: `file-${uuidv4()}`, Body: fileStream}

  let res = await s3.upload(uploadParams).promise()
  let url = res.Location
  console.log(url)

  const metadata = ddo.findServiceByType("metadata").attributes;
  metadata.main.files = [{url, contentType: ''}]

  const encryptedFilesResponse = await nvm.gateway.encrypt(
    ddo.id,
    JSON.stringify(metadata.main.files),
    'PSK-RSA'
  )
  metadata.encryptedFiles = JSON.parse(encryptedFilesResponse)['hash']
  console.log(metadata, ddo.service)
  metadata.main.dateCreated = new Date().toISOString().replace(/\.[0-9]{3}/, "")
  console.log(metadata.main.dateCreated)

  metadata.main.files = [{contentType: '', index: 0} as File]
  ddo.created = new Date().toISOString().replace(/\.[0-9]{3}/, "")
  await nvm.metadata.updateDDO(did, ddo)

  return StatusCodes.OK;
};
