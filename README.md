## Vita DAO CLI

### Installation

```
npm install -g @nevermined-io/vitadao-cli 

or

yarn global add @nevermined-io/vitadao-cli
```

### Usage

```
export INFURA_TOKEN="<your infura token>"
export MNEMONIC="<your 12 words seed phrase>"

to switch the token address (optional):
export TOKEN_ADDRESS="<your erc721 compatible token address>"
```

```
$vitadao --help

usage: vitadao <command>

Commands:
  vitadao accounts                                                  Accounts functions
  vitadao accounts list                                             List all accounts
  vitadao accounts fund account                                     Funds an account on a test net
  vitadao agreements                                                Agreements functions
  vitadao agreements create-sale did price buyer [seller]           creates an sales agreement
  vitadao agreements execute-sale agreementId price seller [buyer]  creates an sales agreement
  vitadao nfts                                                      NFTs functions
  vitadao nfts did                                                  Retrieves information about an NFT
  vitadao nfts mint to id url [minter]                              Mint an NFT

Options:
      --help     Show help                                          [boolean]
      --version  Show version number                                [boolean]
  -v, --verbose  Run with verbose logging                           [boolean]
  -n, --network  the network to use             [string] [default: "rinkeby"]
```
