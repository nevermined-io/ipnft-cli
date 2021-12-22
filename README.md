## IPNFT CLI

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
$ ipnft --help

usage: ipnft <command>

Commands:
  ipnft accounts                                                      Accounts functions
  ipnft accounts list                                                 List all accounts
  ipnft accounts fund account                                         Funds an account on a test net
  ipnft agreements                                                    Agreements functions
  ipnft agreements list did                                           Lists all agreements for given DID
  ipnft agreements show agreementId                                   Shows details about an agreement
  ipnft nfts                                                          NFTs functions
  ipnft nfts show did                                                 Retrieves information about an NFT
  ipnft nfts create [creator] [metadata] [--file data]                Creates an NFT
  ipnft nfts mint did [minter] [uri]                                  Mints an NFT
  ipnft nfts order did [buyer]                                        Orders an NFT by paying for it to the escrow
  ipnft nfts transfer agreementId [seller]                            Transfers the NFT to the buyer and the funds from the escrow to the seller
  ipnft nfts update did [file]                                        Uploads the data of an NFT to S3
  ipnft nfts download did [consumer] [destination]                    Downloads the data of an NFT
  ipnft nfts search [search]                                          Searches for NFTs

Options:
      --help            Show help  [boolean]
      --version         Show version number  [boolean]
  -v, --verbose         Run with verbose logging  [boolean]
  -m, --gas-multiplier  Gas multiplier for transactions  [number]
  -g, --gas             Gas limit for transactions  [number]
  -n, --network         the network to use  [string] [default: "mainnet"]

```
