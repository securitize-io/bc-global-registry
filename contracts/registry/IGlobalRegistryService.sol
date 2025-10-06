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

interface IGlobalRegistryService {

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
}
