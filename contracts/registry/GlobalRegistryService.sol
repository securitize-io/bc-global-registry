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
        keccak256("ExecutePreApprovedTransaction(string senderInvestor,address destination,bytes data,uint256 nonce)");

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
        emit AdminChanged(newAdmin);
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        _revokeRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @inheritdoc IGlobalRegistryService
    function isOperator(address account) public view virtual override returns (bool) {
        return hasRole(OPERATOR_ROLE, account);
    }

    /// @inheritdoc IGlobalRegistryService
    function addOperator(
        address operator
    ) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(operator) {
        _grantRole(OPERATOR_ROLE, operator);
        emit OperatorAdded(operator);
    }

    /// @inheritdoc IGlobalRegistryService
    function revokeOperator(address account) external override addressNotZero(account) onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, account);
        emit OperatorRevoked(account);
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

    function addGlobalInvestorWallet(
        string calldata id,
        address _wallet,
        uint256 _blockLimit
    ) external override whenNotPaused onlySelf newWallet(_wallet) returns (bool) {
        if (_blockLimit < block.number) {
            revert TransactionTooOld();
        }
        address[] memory _wallets = new address[](1);
        _wallets[0] = _wallet;
        return _updateInvestor(id, _wallets);
    }

    function updateInvestor(
        string calldata id,
        string calldata,
        string memory,
        address[] memory _wallets,
        uint8[] memory,
        uint256[] memory,
        uint256[] memory
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool) {
        return _updateInvestor(id, _wallets);
    }

    function _updateInvestor(string calldata id, address[] memory _wallets) internal returns (bool) {
        if (!isInvestor(id)) {
            _registerInvestor(id);
        }

        for (uint8 i = 0; i < _wallets.length; i++) {
            if (isWallet(_wallets[i]) && !CommonUtils.isEqualString(getInvestor(_wallets[i]), id)) {
                revert WalletBelongsToAnotherInvestor();
            } else {
                _addWallet(_wallets[i], id);
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
            string memory,
            uint256[] memory,
            uint256[] memory,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        return ("", new uint256[](4), new uint256[](4), "", "", "", "");
    }

    function setCountry(string calldata, string memory) public pure override returns (bool) {
        revert NotImplemented();
    }

    function getCountry(string memory) public pure override returns (string memory) {
        return "";
    }

    function getCollisionHash(string calldata) public pure override returns (string memory) {
        return "";
    }

    function setAttribute(string calldata, uint8, uint256, uint256, string memory) public pure override returns (bool) {
        revert NotImplemented();
    }

    function getAttributeValue(string memory, uint8) public pure override returns (uint256) {
        return 0;
    }

    function getAttributeExpiry(string memory, uint8) public pure override returns (uint256) {
        return 0;
    }

    function getAttributeProofHash(string memory, uint8) public pure override returns (string memory) {
        return "";
    }

    function addWallet(
        address _address,
        string memory id
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused investorExists(id) newWallet(_address) returns (bool) {
        return _addWallet(_address, id);
    }

    function _addWallet(address _address, string memory id) internal addressNotZero(_address) returns (bool) {
        if (investors[id].walletCount >= type(uint8).max) {
            revert MaxWalletsReached();
        }
        address sender = _msgSender();
        investorsWallets[_address] = Wallet(id, sender);
        investors[id].walletCount++;

        emit GlobalWalletAdded(_address, id, sender);

        return true;
    }

    function nonceByInvestor(string memory _investorId) public view override returns (uint256) {
        return noncePerInvestor[_investorId];
    }

    function removeWallet(
        address _address,
        string memory id
    )
        public
        override
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        addressNotZero(_address)
        walletExists(_address)
        walletBelongsToInvestor(_address, id)
        returns (bool)
    {
        delete investorsWallets[_address];
        investors[id].walletCount--;

        emit GlobalWalletRemoved(_address, id, msg.sender);

        return true;
    }

    function getInvestor(address _address) public view override returns (string memory) {
        return investorsWallets[_address].owner;
    }

    function getInvestorDetails(address _address) public view override returns (string memory, string memory) {
        return (getInvestor(_address), getCountry(getInvestor(_address)));
    }

    function isInvestor(string memory id) public view override returns (bool) {
        return !CommonUtils.isEmptyString(investors[id].id);
    }

    function isAccreditedInvestor(string calldata) external pure override returns (bool) {
        return true;
    }

    function isAccreditedInvestor(address) external pure override returns (bool) {
        return true;
    }

    function isQualifiedInvestor(address) external pure override returns (bool) {
        return true;
    }

    function isQualifiedInvestor(string calldata) external pure override returns (bool) {
        return true;
    }

    function getInvestors(address _from, address _to) external view override returns (string memory, string memory) {
        return (investorsWallets[_from].owner, investorsWallets[_to].owner);
    }

    function isWallet(address _address) public view override returns (bool) {
        return isInvestor(getInvestor(_address));
    }

    function executePreApprovedTransaction(
        bytes memory signature,
        ExecutePreApprovedTransaction calldata txData
    ) external override whenNotPaused returns (bytes memory) {
        bytes32 digest = hashTx(txData);
        address signer = ECDSA.recover(digest, signature);

        // Check recovered address role
        if (!isOperator(signer)) {
            revert InvalidEIP712Signature();
        }
        noncePerInvestor[txData.senderInvestor] = noncePerInvestor[txData.senderInvestor] + 1;
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
                noncePerInvestor[txData.senderInvestor]
            )
        );

        return _hashTypedDataV4(structHash);
    }
}
