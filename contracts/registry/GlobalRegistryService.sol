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

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IGlobalRegistryService} from "./IGlobalRegistryService.sol";
import {BaseRBACContract} from "../utils/BaseRBACContract.sol";
import {CommonUtils} from "@securitize/digital_securities/contracts/utils/CommonUtils.sol";

import {GlobalRegistryServiceDataStore} from "../data-stores/GlobalRegistryServiceDataStore.sol";

contract GlobalRegistryService is
    GlobalRegistryServiceDataStore,
    EIP712Upgradeable,
    IGlobalRegistryService,
    BaseRBACContract
{
    using Address for address;
    using ECDSA for bytes32;

    string public constant NAME = "GlobalRegistryService";
    string public constant VERSION = "1";

    bytes32 private constant TXTYPE_HASH =
        keccak256(
            "ExecutePreApprovedTransaction(string senderInvestor,address destination,bytes data,uint256 nonce,uint256 deadline)"
        );

    uint8 private constant MAX_WALLETS_PER_INVESTOR = type(uint8).max;

    modifier onlySelf() {
        if (_msgSender() != address(this)) {
            revert OnlySelfError();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public override onlyProxy initializer {
        __EIP712_init(NAME, VERSION);
        __BaseRBACContract_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @inheritdoc IGlobalRegistryService
    function isAdmin(address account) public view virtual override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    /// @inheritdoc IGlobalRegistryService
    function changeAdmin(
        address newAdmin
    ) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(newAdmin) {
        if (_grantRole(DEFAULT_ADMIN_ROLE, newAdmin) && _revokeRole(DEFAULT_ADMIN_ROLE, _msgSender())) {
            emit AdminChanged(newAdmin);
        }
    }

    /// @inheritdoc IGlobalRegistryService
    function isOperator(address account) public view virtual override returns (bool) {
        return hasRole(OPERATOR_ROLE, account);
    }

    /// @inheritdoc IGlobalRegistryService
    function addOperator(
        address operator
    ) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(operator) {
        if (_grantRole(OPERATOR_ROLE, operator)) {
            emit OperatorAdded(operator);
        }
    }

    function grantRole(
        bytes32 role,
        address account
    ) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(account) {
        if (_grantRole(role, account) && role == OPERATOR_ROLE) {
            emit OperatorAdded(account);
        }
    }

    /// @inheritdoc IGlobalRegistryService
    function revokeOperator(address account) external override addressNotZero(account) onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_revokeRole(OPERATOR_ROLE, account)) {
            emit OperatorRevoked(account);
        }
    }

    function registerInvestor(
        string calldata id,
        string calldata
    ) public override newInvestor(id) whenNotPaused onlyRole(OPERATOR_ROLE) returns (bool) {
        return _registerInvestor(id);
    }

    function _registerInvestor(string calldata id) internal returns (bool) {
        address sender = _msgSender();
        investors[id] = Investor(id, sender, 0);

        emit GlobalInvestorAdded(id, sender);

        return true;
    }

    function removeInvestor(
        string calldata id
    ) public override investorExists(id) whenNotPaused onlyRole(OPERATOR_ROLE) returns (bool) {
        if (investors[id].walletCount > 0) {
            revert InvestorHasWallets();
        }

        delete investors[id];

        emit GlobalInvestorRemoved(id, msg.sender);

        return true;
    }

    /// @inheritdoc IGlobalRegistryService
    function addGlobalInvestorWallet(
        string calldata id,
        address walletAddress
    ) external override whenNotPaused onlySelf newWallet(walletAddress) returns (bool) {
        address[] memory walletAddresses = new address[](1);
        walletAddresses[0] = walletAddress;
        return _updateInvestor(id, walletAddresses);
    }

    function updateInvestor(
        string calldata id,
        string calldata,
        string memory,
        address[] memory walletAddresses,
        uint8[] memory,
        uint256[] memory,
        uint256[] memory
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool) {
        return _updateInvestor(id, walletAddresses);
    }

    function _updateInvestor(string calldata id, address[] memory walletAddresses) internal returns (bool) {
        uint256 walletAddressesLen = walletAddresses.length;
        if (walletAddressesLen >= MAX_WALLETS_PER_INVESTOR) {
            revert TooManyWallets();
        }

        if (!isInvestor(id)) {
            _registerInvestor(id);
        }

        for (uint8 i; i < walletAddressesLen; i++) {
            address newWallet = walletAddresses[i];
            string memory walletExistingInvestor = getInvestor(newWallet);

            if (!isInvestor(walletExistingInvestor)) {
                _addWallet(newWallet, id);
            } else if (!CommonUtils.isEqualString(walletExistingInvestor, id)) {
                revert WalletBelongsToAnotherInvestor();
            }
        }

        return true;
    }

    function getInvestorDetailsFull(
        string memory
    )
    public
    pure
    override
    returns (
        string memory country,
        uint256[] memory attributeValues,
        uint256[] memory attributeExpiries,
        string memory attributeProofHashes0,
        string memory attributeProofHashes1,
        string memory attributeProofHashes2,
        string memory attributeProofHashes3
    )
    {
        // intentionally empty to return default values
    }

    function setCountry(string calldata, string memory) public pure override returns (bool) {
        revert NotImplemented();
    }

    function getCountry(string memory) public pure override returns (string memory country) {
        // intentionally empty to return default values
    }

    function getCollisionHash(string calldata) public pure override returns (string memory) {
        revert NotImplemented();
    }

    function setAttribute(string calldata, uint8, uint256, uint256, string memory) public pure override returns (bool) {
        revert NotImplemented();
    }

    function getAttributeValue(string memory, uint8) public pure override returns (uint256) {
        revert NotImplemented();
    }

    function getAttributeExpiry(string memory, uint8) public pure override returns (uint256) {
        revert NotImplemented();
    }

    function getAttributeProofHash(string memory, uint8) public pure override returns (string memory) {
        revert NotImplemented();
    }

    function addWallet(
        address walletAddress,
        string memory id
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused investorExists(id) newWallet(walletAddress) returns (bool) {
        return _addWallet(walletAddress, id);
    }

    function _addWallet(address walletAddress, string memory id) internal addressNotZero(walletAddress) returns (bool) {
        if (investors[id].walletCount >= MAX_WALLETS_PER_INVESTOR) {
            revert MaxWalletsReached();
        }
        address sender = _msgSender();
        investorsWallets[walletAddress] = Wallet(id, sender);
        investors[id].walletCount++;

        emit GlobalWalletAdded(walletAddress, id, sender);

        return true;
    }

    /// @inheritdoc IGlobalRegistryService
    function walletCountByInvestor(string calldata investorId) external view override returns (uint256) {
        return investors[investorId].walletCount;
    }

    function nonceByInvestor(string memory investorId) public view override returns (uint256) {
        return noncePerInvestor[investorId];
    }

    /// @inheritdoc IGlobalRegistryService
    function incrementInvestorNonce(
        string memory investorId
    ) external virtual override onlyRole(OPERATOR_ROLE) whenNotPaused investorExists(investorId) {
        noncePerInvestor[investorId]++;
        emit InvestorNonceIncremented(investorId, noncePerInvestor[investorId]);
    }

    function removeWallet(
        address walletAddress,
        string memory id
    )
        public
        override
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        addressNotZero(walletAddress)
        walletExists(walletAddress)
        walletBelongsToInvestor(walletAddress, id)
        returns (bool)
    {
        delete investorsWallets[walletAddress];
        investors[id].walletCount--;

        emit GlobalWalletRemoved(walletAddress, id, msg.sender);

        return true;
    }

    function getInvestor(address walletAddress) public view override returns (string memory) {
        return investorsWallets[walletAddress].owner;
    }

    function getInvestorDetails(address walletAddress) public view override returns (string memory, string memory) {
        return (getInvestor(walletAddress), "");
    }

    function isInvestor(string memory id) public view override returns (bool) {
        return !CommonUtils.isEmptyString(investors[id].id);
    }

    function isAccreditedInvestor(string calldata) external pure override returns (bool) {
        revert NotImplemented();
    }

    function isAccreditedInvestor(address) external pure override returns (bool) {
        revert NotImplemented();
    }

    function isQualifiedInvestor(address) external pure override returns (bool) {
        revert NotImplemented();
    }

    function isQualifiedInvestor(string calldata) external pure override returns (bool) {
        revert NotImplemented();
    }

    function getInvestors(address from, address to) external view override returns (string memory, string memory) {
        return (investorsWallets[from].owner, investorsWallets[to].owner);
    }

    function isWallet(address walletAddress) public view override returns (bool) {
        return isInvestor(getInvestor(walletAddress));
    }

    function executePreApprovedTransaction(
        bytes memory signature,
        ExecutePreApprovedTransaction calldata txData
    ) external override whenNotPaused returns (bytes memory) {
        if (txData.deadline < block.timestamp) {
            revert TransactionTooOld();
        }
        bytes32 digest = hashTx(txData);
        address signer = ECDSA.recover(digest, signature);

        // Check recovered address role
        if (!isOperator(signer)) {
            revert InvalidEIP712Signature();
        }
        noncePerInvestor[txData.senderInvestor]++;
        return Address.functionCall(txData.destination, txData.data);
    }

    /// @dev Computes the digest to sign (EIP-712)
    function hashTx(ExecutePreApprovedTransaction calldata txData) private view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                TXTYPE_HASH,
                keccak256(bytes(txData.senderInvestor)),
                txData.destination,
                keccak256(txData.data),
                noncePerInvestor[txData.senderInvestor],
                txData.deadline
            )
        );

        return _hashTypedDataV4(structHash);
    }
}
