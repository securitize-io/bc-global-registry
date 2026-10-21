# Global Registry Service

Global Registry Service is a smart contract for managing investors and wallets with a role-based access control. 
Operators can register investors, add wallets, and **pre-approve transactions** using `EIP-712` signatures. Any user 
can execute these **pre-approved transactions** on-chain by submitting the signed payload and paying the transaction fee.
An investor can have up to 255 wallets.

<p align="center">
  <img src="img/grs-solution.png" alt="Securitize GRS Solution" width="900"/>
</p>

## Roles and Permissions

The Global Registry Service uses a role-based access control system to manage permissions:

- **OPERATOR**:  
  Responsible for managing investors and wallets within the system.
    - Can register new investors and associate wallets with them.
    - Can remove investors and wallets when necessary.
    - Can pre-approve transactions signing EIP-712 compliant payloads for investor actions.

- **ADMIN**:  
  Oversees the overall system and manages OPERATOR accounts.
    - Can register new OPERATORs and revoke existing ones.
    - Has the authority to update and upgrade smart contracts as needed.
    - It must be a multi-signature or fireblocks wallet to enhance security.

These roles ensure secure and organized management of registry operations, with clear separation of duties between daily 
operations and administrative tasks.

## EIP-712 Signatures

The Global Registry Service supports secure off-chain authorization using EIP-712 signatures. This allows an Operator to 
pre-approve specific actions, which can then be executed on-chain by any user (including investors), who pays the 
transaction fee.


### Signature Flow

1. **Operator signs EIP-712 message**: The Operator creates and signs an EIP-712 structured message authorizing a specific transaction (e.g., associating a wallet, updating investor data). 
2. **Unsigned transaction is generated**:An unsigned transaction is prepared for the executePreApprovedTransaction function, using the signed EIP-712 message as input.
3. **User or investor submits the transaction**: Any user or investor can submit the unsigned transaction to the blockchain, calling executePreApprovedTransaction with the Operator's signature. The sender pays the gas fee, but the action is only executed if the signature is valid and the Operator has the required permissions.

This mechanism enables workflows where **Operators** can authorize actions off-chain, and users can execute them on-chain.

### Relevant Functions:

- `addGlobalInvestorWallet`: Allows associating a wallet with an investor, typically by an Operator. It's the data to execute contained a pre-approved transaction. It uses a block limit to manage the time that pre-approved transaction is valid.
- `executePreApprovedTransaction`: Validates the Operator's EIP-712 signature and executes the pre-approved transaction, regardless of who submits it.

## Deployment

```shell
npm install

```
Add an `.env` file to the project and replace the values defined in `hardhat.config.ts`. Please refer to `.env-example` for guidance

```shell
npx hardhat deploy-all --admin 0x52Ae985C67D4cEE647E93eAa037bA96F7B0C0556 --operator 0x744cee96E39852C82D877eb329378Fcdf99e83F1
```
__Parameters__:

- **admin** param: If set, it will be the ADMIN role holder. If not set, the deployer will be the ADMIN role holder.
- **operator** param: If set, it will be the OPERATOR role holder.

## Testing the GRS with EIP-712 signatures

```sh
npx hardhat add-investor-eip-712 --grsaddress 0x741239565376723E0571D1f6493208791483c5a3 --investorid diego --wallet 0xC77825fa775E1D1F69668241676d15e59075031a --network fuji
```

## Contract Verification 

To verify the contracts on a specific network, you need to configure the environment variables with the corresponding 
Etherscan API accounts. For example, we define the following variables in the `.env` file.

For example, the Fuji Avalanche network is open and public, but there are other explorers that require an API key.

```yaml
API_KEY_AVALANCHE=Your-Api-key
API_URL_AVALANCHE=https://api.your-provider.info/v2/network/testnet/evm/43113/etherscan
BROWSER_URL_AVALANCHE=https://testnet.your-porvider.info/blockchain/c
```

```shell
npx hardhat verify-grs --network fuji --proxy 0x1F35e3f472a9362782fa4707100b9280168A2F56 
```

## Security Audit

The Global Registry Service was audited by [Cyfrin](https://www.cyfrin.io) between October 27 and October 29, 2025.
No critical or high-severity issues were found. All medium and low-severity findings were resolved and verified by Cyfrin.

- **Report**: [Cyfrin — Global Registry Audit Report v2.0 (November 6, 2025)](audits/2025-11-06-cyfrin-securitize-global-registry-v2.0.pdf)
- **Scope**: `GlobalRegistryServiceDataStore.sol`, `GlobalRegistryService.sol`, `BaseRBACContract.sol`

| Severity      | Found | Resolved | Acknowledged |
|---------------|------:|---------:|-------------:|
| Critical      |     0 |        0 |            0 |
| High          |     0 |        0 |            0 |
| Medium        |     3 |        3 |            0 |
| Low           |     3 |        3 |            0 |
| Informational |     6 |        4 |            2 |
| Gas           |     4 |        2 |            2 |

> **Note on commit hashes:** this repository's history was rewritten before it was made public, so the commit hashes
> cited in the report differ from the ones here. Audited commit `e36348808186` corresponds to
> [`6396798d07bf`](https://github.com/securitize-io/bc-global-registry/commit/6396798d07bfeffb2c87ab87e41c678ce8450cbf),
> and fix commit `22545b3cd240` corresponds to
> [`356241fcea97`](https://github.com/securitize-io/bc-global-registry/commit/356241fcea97f98f28dc670d94afb5a33bd4f606).
> The report also covers contracts from the separate `dstoken` repository, which are not part of this repository.
