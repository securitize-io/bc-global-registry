# Global Registry Service

<p align="center">
  <img src="img/grs-solution.png" alt="Securitize GRS Solution" width="900"/>
</p>

## Roles and Permissions

The Global Registry Service uses a role-based access control system to manage permissions:

- **OPERATOR**:  
  Responsible for managing investors and wallets within the system.
    - Can register new investors and associate wallets with them.
    - Can remove investors and wallets when necessary.

- **ADMIN**:  
  Oversees the overall system and manages OPERATOR accounts.
    - Can register new OPERATORs and revoke existing ones.
    - Has the authority to update and upgrade smart contracts as needed.

These roles ensure secure and organized management of registry operations, with clear separation of duties between daily operations and administrative tasks.

## Deployment

```shell
npm install

```
Add an `.env` file to the project and replace the values defined in `hardhat.config.ts`. Please refer to `.env-example` for guidance

```shell
npx hardhat deploy-all --admin 0x56AE3B324e3f301f78015D9b6b74470a0e2A3a15
```
