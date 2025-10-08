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
    modifier addressNotZero(address _address) {
        if (_address == address(0)) {
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
    event InvestorAdded(string investorId, address sender);

    /**
     *  @notice Emitted when an investor is removed.
     *  @dev Indicates that the investor was removed from Global Registry Service.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event InvestorRemoved(string investorId, address sender);

    /**
     *  @notice Emitted when a wallet is added to an investor.
     *  @dev Indicates that a wallet was associated with an investor in Global Registry Service.
     *  @param wallet string The unique identifier of the investor.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event WalletAdded(address wallet, string investorId, address sender);

    /**
     *  @notice Emitted when a wallet is removed from an investor.
     *  @dev Indicates that a wallet was removed from an investor in Global Registry Service.
     *  @param wallet string The unique identifier of the investor.
     *  @param investorId string The unique identifier of the investor.
     *  @param sender address The address that performed the action.
     */
    event WalletRemoved(address wallet, string investorId, address sender);
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

    /// @dev Thrown when a function is not implemented.
    /// @custom:selector 0xd6234725
    error NotImplemented();

    /// @dev Thrown when a zero address is provided where a valid address is required.
    /// @custom:selector 0x14c880ca
    error ZeroAddressInvalid();

    /// @dev Thrown when the length of provided parameters does not match the expected length.
    /// @custom:selector 0xb1c97b39
    error ParameterLengthMismatch();

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

    /// @dev Constant role identifier for the operator role.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @notice Checks if an account holds the Operator role.
     * @dev Returns true if the given account has the Operator role.
     * @param _account address The address to check for the Operator role.
     * @return True if the account has the Operator role, false otherwise.
     */
    function isOperator(address _account) public view virtual returns (bool);

    /**
     * @notice Checks if an account holds the Admin role.
     * @dev Returns true if the given account has the Admin role.
     * @param _account address The address to check for the Admin role.
     * @return True if the account has the Admin role, false otherwise.
     */
    function isAdmin(address _account) public view virtual returns (bool);

    /**
     * @notice Changes the admin of the Global Registry Service.
     * @dev Updates the admin address. Emits {AdminChanged}.
     * @param _newAdmin address The address of the new admin.
     */
    function changeAdmin(address _newAdmin) external virtual;

    /**
     * @notice Grants the Operator role to a specified account.
     * @dev Adds a new Operator. Emits {OperatorAdded}.
     * @param _account address The address to grant the Operator role.
     */
    function addOperator(address _account) external virtual;

    /**
     * @notice Revokes the Operator role to a specified account.
     * @dev Revokes a Operator. Emits {OperatorRevoked}.
     * @param _account address The address to revoke the Operator role.
     */
    function revokeOperator(address _account) external virtual;
}
