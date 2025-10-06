pragma solidity 0.8.22;

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

abstract contract IGlobalRegistryService {
    modifier addressNotZero(address _address) {
        if (_address == address(0)) {
            revert ZeroAddressInvalid();
        }
        _;
    }

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

    /// @dev Thrown when a zero address is provided where a valid address is required.
    error ZeroAddressInvalid();

    /// @dev Thrown when the length of provided parameters does not match the expected length.
    error ParameterLengthMismatch();

    /// @dev Thrown when attempting to register a wallet that is already associated with another investor.
    error WalletBelongsToAnotherInvestor();

    /// @dev Thrown when attempting to remove an investor that still has associated wallets.
    error InvestorHasWallets();

    /// @dev Thrown when an operation is attempted on a non-existent investor attribute
    error UnknownAttribute();

    /// @dev Constant role identifier for the operator role.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    function isOperator(address _account) public virtual view returns (bool);

    function isAdmin(address _account) public virtual view returns (bool);

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
