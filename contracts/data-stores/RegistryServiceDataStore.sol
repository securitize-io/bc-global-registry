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

contract RegistryServiceDataStore {
    struct Wallet {
        string owner;
        address creator;
    }

    struct Investor {
        string id;
        address creator;
        uint256 walletCount;
    }

    mapping(string investorId => Investor investor) internal investors;
    mapping(address walletAddress => Wallet wallet) internal investorsWallets;

    uint256[48] private __gap;
}
