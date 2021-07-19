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

vitadao <command>

Commands:
  vitadao accounts                    get accounts list
  vitadao mint to id url [minter]     mint an nft
  vitadao create-sales-agreement did  creates an sales agreement
  vitadao nft did                     Retrieves information about an NFT

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -v, --verbose  Run with verbose logging                              [boolean]
  -n, --network  the network to use                [string] [default: "rinkeby"]
```