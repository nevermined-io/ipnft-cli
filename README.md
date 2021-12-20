## Vita DAO CLI

### Installation

```
npm install -g @nevermined-io/ipnft-cli

or

yarn global add @nevermined-io/ipnft-cli
```

### Usage

**Setup Accounts**:

- Option 1: Use a mnemonic

```
export MNEMONIC="<your 12 words seed phrase>"
```

- Option 2: Use keyfiles

```
export CREATOR_KEYFILE="<path to keyfile>"
export CREATOR_PASSWORD="<keyfile password>"

export BUYER_KEYFILE="<path to keyfile>"
export BUYER_PASSWORD="<keyfile password>"

export MINTER_KEYFILE="<path to keyfile>"
export MINTER_PASSWORD="<keyfile password>"
```

---

```
export INFURA_TOKEN="<your infura token>"

to switch the NFT token address (optional):
export NFT_TOKEN_ADDRESS="<your erc721 compatible token address>"

to switch the ERC20 token address (optional):
export ERC20_TOKEN_ADDRESS="<your erc20 compatible token address>"
```

S3 configuration:
```
export S3ENDPOINT="<S3 base url>"
export S3ACCESSKEYID=<your access key id>
export S3SECRETACCESSKEY=<your access key>
```

Etherscan API
```
export ETHERSCANAPIKEY=<your apikey>
```

```
$vitadao --help

usage: vitadao <command>

Commands:
  vitadao accounts                                                      Accounts functions
  vitadao accounts list                                                 List all accounts
  vitadao accounts fund account                                         Funds an account on a test net
  vitadao agreements                                                    Agreements functions
  vitadao agreements list did                                           Lists all agreements for given DID
  vitadao agreements show agreementId                                   Shows details about an agreement
  vitadao nfts                                                          NFTs functions
  vitadao nfts show did                                                 Retrieves information about an NFT
  vitadao nfts create [creator] [metadata] [--file data]                Creates an NFT
  vitadao nfts mint did [minter] [uri]                                  Mints an NFT
  vitadao nfts order did [buyer]                                        Orders an NFT by paying for it to the escrow
  vitadao nfts transfer agreementId [seller]                            Transfers the NFT to the buyer and the funds from the escrow to the seller
  vitadao nfts update did [file]                                        Uploads the data of an NFT to S3
  vitadao nfts download did [consumer] [destination]                    Downloads the data of an NFT
  vitadao nfts search [search]                                          Searches for NFTs

Options:
      --help            Show help  [boolean]
      --version         Show version number  [boolean]
  -v, --verbose         Run with verbose logging  [boolean]
  -m, --gas-multiplier  Gas multiplier for transactions  [number]
  -g, --gas             Gas limit for transactions  [number]
  -n, --network         the network to use  [string] [default: "mainnet"]

```
