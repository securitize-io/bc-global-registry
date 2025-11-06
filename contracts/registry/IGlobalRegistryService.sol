/**
 * Copyright 2025 Securitize Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

pragma solidity 0.8.22;

import {IDSRegistryService} from "@securitize/digital_securities/contracts/registry/IDSRegistryService.sol";

abstract contract IGlobalRegistryService is IDSRegistryService {
    /**
     * @dev Tx type - EIP712
     */
    struct ExecutePreApprovedTransaction {
        string senderInvestor;
        address destination;
        bytes data;
        uint256 deadline;
    }

    modifier addressNotZero(address addressToCheck) {
        if (addressToCheck == address(0)) {
            revert ZeroAddressInvalid();
        }
        _;
    }

    /**
     *  @notice Emitted when an investor is added.
     *  @dev Indicates that the investor was added to Global Registry Service.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event GlobalInvestorAdded(string investorId, address indexed sender);

    /**
     *  @notice Emitted when an investor is removed.
     *  @dev Indicates that the investor was removed from Global Registry Service.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event GlobalInvestorRemoved(string investorId, address indexed sender);

    /**
     *  @notice Emitted when a wallet is added to an investor.
     *  @dev Indicates that a wallet was associated with an investor in Global Registry Service.
     *  @param wallet string The unique identifier of the investor.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event GlobalWalletAdded(address indexed wallet, string investorId, address indexed sender);

    /**
     *  @notice Emitted when a wallet is removed from an investor.
     *  @dev Indicates that a wallet was removed from an investor in Global Registry Service.
     *  @param wallet string The unique identifier of the investor.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event GlobalWalletRemoved(address indexed wallet, string investorId, address indexed sender);
    /**
     * @notice Emitted when the admin account is changed.
     * @dev Indicates that the Global Registry Service admin has been updated.
     * @param admin address The address of the new admin.
     */
    event AdminChanged(address indexed admin);

    /**
     * @notice Emitted when a new Operator is added.
     * @dev Indicates that a new account has been granted the Operator role.
     * @param operator address The address granted the Operator role.
     */
    event OperatorAdded(address indexed operator);

    /**
     * @notice Emitted when an Operator is revoked.
     * @dev Indicates that a new account has been revoked the Operator role.
     * @param operator address The address revoked the Operator role.
     */
    event OperatorRevoked(address indexed operator);

    /**
     * @notice Emitted when an investor's nonce is incremented.
     * @dev Indicates that the nonce for a specific investor has been updated.
     * @param investorId string The unique identifier of the investor.
     * @param newNonce uint256 The new nonce value for the investor.
     */
    event InvestorNonceIncremented(string investorId, uint256 newNonce);

    /// @dev Thrown when a function is not implemented.
    /// @custom:selector 0xd6234725
    error NotImplemented();

    /// @dev Thrown when a zero address is provided where a valid address is required.
    /// @custom:selector 0x14c880ca
    error ZeroAddressInvalid();

    /// @dev Thrown when attempting to register a wallet that is already associated with another investor.
    /// @custom:selector 0x78a65e20
    error WalletBelongsToAnotherInvestor();

    /// @dev Thrown when attempting to remove an investor that still has associated wallets.
    /// @custom:selector 0xcf7758a4
    error InvestorHasWallets();

    /// @dev Thrown when an operation is attempted on a non-existent investor attribute
    /// @custom:selector 0x7d76f995
    error UnknownAttribute();

    /// @dev Thrown when trying to add a wallet but the maximum number of wallets for the investor has been reached.
    /// @custom:selector 0xf67adce7
    error MaxWalletsReached();

    /// @dev Thrown when update an investor an the array of wallets is bigger than max supported.
    /// @custom:selector 0x86dbbe80
    error TooManyWallets();

    /// @dev Thrown when a transaction's block limit has been exceeded.
    /// @custom:selector 0xa83116fc
    error TransactionTooOld();

    /// @dev Thrown when an invalid EIP-712 signature is provided. For example signer is not OPERATOR
    /// @custom:selector 0xb81d58e7
    error InvalidEIP712Signature();

    /// @dev Thrown when trying to execute a function that can only be called by the contract itself.
    /// @custom:selector 0x28a2ea3b
    error OnlySelfError();

    /// @dev Thrown when trying to assign a role to an account that already has it.
    /// @custom:selector 0x17e914bf
    error RoleAlreadyAssigned();

    /// @dev Constant role identifier for the operator role.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @dev Returns nonce per investor
     * @param investorId string (blockchainId).
     * @return nonce
     */
    function nonceByInvestor(string memory investorId) public view virtual returns (uint256);

    /**
     * @dev Increments nonce for investor. Used to invalidate pre-approved transactions.
     * @param investorId string (blockchainId).
     */
    function incrementInvestorNonce(string memory investorId) external virtual;

    /**
     * @notice Registers a new investor and a wallet in the Global Registry Service.
     * @dev Adds a new investor if it does not exists with the provided ID and metadata. Emits {GlobalInvestorAdded}.
     * It also Associates the provided wallet with the investor. Emits {GlobalWalletAdded}.
     * @param id string The unique identifier for the investor.
     * @param wallet address The wallet to associate to investor.
     * @return True if the investor was successfully registered, false otherwise.
     */
    function addGlobalInvestorWallet(string memory id, address wallet) external virtual returns (bool);
    /**
     * @dev Validates off-chain EIP-712 message signature and executes encoded transaction data.
     * @param signature - eip712 signature
     * @param txData - tx data
     * @return bytes - the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     */
    function executePreApprovedTransaction(
        bytes memory signature,
        ExecutePreApprovedTransaction calldata txData
    ) external virtual returns (bytes memory);

    /**
     * @notice Checks if an account holds the Operator role.
     * @dev Returns true if the given account has the Operator role.
     * @param account address The address to check for the Operator role.
     * @return True if the account has the Operator role, false otherwise.
     */
    function isOperator(address account) public view virtual returns (bool);

    /**
     * @notice Checks if an account holds the Admin role.
     * @dev Returns true if the given account has the Admin role.
     * @param account address The address to check for the Admin role.
     * @return True if the account has the Admin role, false otherwise.
     */
    function isAdmin(address account) public view virtual returns (bool);

    /**
     * @notice Changes the admin of the Global Registry Service.
     * @dev Updates the admin address. Emits {AdminChanged}.
     * @param newAdmin address The address of the new admin.
     */
    function changeAdmin(address newAdmin) external virtual;

    /**
     * @notice Grants the Operator role to a specified account.
     * @dev Adds a new Operator. Emits {OperatorAdded}.
     * @param account address The address to grant the Operator role.
     */
    function addOperator(address account) external virtual;

    /**
     * @notice Revokes the Operator role to a specified account.
     * @dev Revokes a Operator. Emits {OperatorRevoked}.
     * @param account address The address to revoke the Operator role.
     */
    function revokeOperator(address account) external virtual;

    /**
     * @notice Returns the number of wallets associated with a given investor.
     * @dev Retrieves the count of wallets linked to the specified investor ID.
     * @param investorId string The unique identifier of the investor.
     * @return uint256 The number of wallets associated with the investor.
     */
    function walletCountByInvestor(string calldata investorId) external virtual returns (uint256);
}
