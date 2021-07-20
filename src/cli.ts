import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  createSalesAgreement,
  getNft,
  mint,
  executeSalesAgreement,
  accountsList,
  accountsFund,
} from "./commands";
import chalk from "chalk";

const cmdHandler = async (cmd: Function, argv: any) => {
  const { network } = argv;

  console.log(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`));
  return process.exit(await cmd(argv));
};

const y = yargs(hideBin(process.argv))
  .wrap(yargs.terminalWidth())
  .usage("usage: $0 <command>")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .option("network", {
    alias: "n",
    type: "string",
    default: "rinkeby",
    description: "the network to use",
  });

// hidden default command to display the help when used without parameters
y.command(
  "$0",
  false,
  () => {},
  (argv) => {
    yargs.showHelp();
  }
);

y.command(
  "accounts",
  "Accounts functions",
  (yargs) => {
    return yargs
      .usage("usage: $0 accounts <command> parameters [options]")
      .command(
        "list",
        "List all accounts",
        (yargs) => {
          return yargs.option("with-inventory", {
            type: "boolean",
            default: false,
            description: "Load NFT inventory as well",
          });
        },
        async (argv) => {
          return cmdHandler(accountsList, argv);
        }
      )
      .command(
        "fund account",
        "Funds an account on a test net",
        (yargs) => {
          return yargs.positional("account", {
            describe: "the account to fund",
            type: "string",
          });
        },
        async (argv) => {
          return cmdHandler(accountsFund, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
  }
);

y.command(
  "agreements",
  "Agreements functions",
  (yargs) => {
    return yargs
      .usage("usage: $0 agreements <command> parameters [options]")
      .command(
        "create-sale did price buyer [seller]",
        "creates an sales agreement",
        (yargs) => {
          return yargs
            .positional("did", {
              describe: "the DID to retrieve",
              type: "string",
            })
            .positional("price", {
              describe: "the price of the asset",
              type: "number",
            })
            .positional("buyer", {
              describe: "the buyer address",
              type: "string",
            })
            .positional("seller", {
              describe: "the seller address",
              type: "string",
            });
        },
        async (argv) => {
          return cmdHandler(createSalesAgreement, argv);
        }
      )

      .command(
        "execute-sale agreementId price seller [buyer]",
        "creates an sales agreement",
        (yargs) => {
          return yargs
            .positional("agreementId", {
              describe: "the agreement id address",
              type: "string",
            })
            .positional("price", {
              describe: "the price of the asset",
              type: "number",
            })
            .positional("seller", {
              describe: "the seller address",
              type: "string",
            })
            .positional("buyer", {
              describe: "the buyer address",
              type: "string",
            });
        },
        async (argv) => {
          return cmdHandler(executeSalesAgreement, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
  }
);

y.command(
  "nfts",
  "NFTs functions",
  (yargs) => {
    return yargs
      .usage("usage: $0 nfts <command> parameters [options]")
      .command(
        "did",
        "Retrieves information about an NFT",
        (yargs) => {
          return yargs.positional("did", {
            describe: "the did to retrieve",
            type: "string",
          });
        },
        async (argv) => {
          return cmdHandler(getNft, argv);
        }
      )
      .command(
        "mint to id url [minter]",
        "Mint an NFT",
        (yargs) => {
          return yargs
            .positional("to", {
              describe: "receiver address",
              type: "string",
            })
            .positional("id", {
              describe: "the id of the token to mint",
              type: "string",
            })
            .positional("url", {
              describe: "the url of the asset",
              type: "string",
            })
            .positional("minter", {
              describe: "the address of the minter",
              type: "string",
            });
        },
        async (argv) => {
          return cmdHandler(mint, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
  }
);

y.argv;
