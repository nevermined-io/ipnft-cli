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

to switch the NFT token address (optional):
export NFT_TOKEN_ADDRESS="<your erc721 compatible token address>"

to switch the ERC20 token address (optional):
export ERC20_TOKEN_ADDRESS="<your erc20 compatible token address>"
```

```
$vitadao --help

usage: vitadao <command>

Commands:
  vitadao accounts                                                      Accounts functions
  vitadao accounts list                                                 List all accounts
  vitadao accounts fund account                                         Funds an account on a test net
  vitadao agreements                                                    Agreements functions
  vitadao agreements create-sale did price buyer [seller]               Creates an sales offer for an NFT with the given DID
  vitadao agreements execute-sale agreementId price seller [buyer]      Pays for an NFT and stores it in the escrow
  vitadao agreements finalize-sale agreementId price buyer [seller]     Transfers the NFT and retrieves the payment from the escrow
  vitadao agreements create-access did accessor [holder]                Creates an access agreement
  vitadao agreements execute-access agreementId accessor [holder]       Executes an access agreement
  vitadao nfts                                                          NFTs functions
  vitadao nfts show did                                                 Retrieves information about an NFT
  vitadao nfts mint to id url [minter]                                  Mint an NFT

Options:
      --help     Show help                                              [boolean]
      --version  Show version number                                    [boolean]
  -v, --verbose  Run with verbose logging                               [boolean]
  -n, --network  the network to use                 [string] [default: "rinkeby"]
```
