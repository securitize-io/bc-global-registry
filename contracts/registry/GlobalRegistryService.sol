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

import {IGlobalRegistryService} from "./IGlobalRegistryService.sol";
import {BaseRBACContract} from "../utils/BaseRBACContract.sol";
import {CommonUtils} from "../utils/CommonUtils.sol";
import {IDSRegistryService} from "./IDSRegistryService.sol";
import {RegistryServiceDataStore} from "../data-stores/RegistryServiceDataStore.sol";

contract GlobalRegistryService is
    RegistryServiceDataStore,
    IGlobalRegistryService,
    BaseRBACContract
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }



    function initialize() public override onlyProxy initializer {
        __BaseRBACContract_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @inheritdoc IGlobalRegistryService
    function isAdmin(address _account) public view virtual override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _account);
    }

    /// @inheritdoc IGlobalRegistryService
    function changeAdmin(
        address _newAdmin
    ) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(_newAdmin) {
        emit AdminChanged(_newAdmin);
        _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
        _revokeRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @inheritdoc IGlobalRegistryService
    function isOperator(address _account) public view virtual override returns (bool) {
        return hasRole(OPERATOR_ROLE, _account);
    }

    /// @inheritdoc IGlobalRegistryService
    function addOperator(
        address _operator
    ) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) addressNotZero(_operator) {
        _grantRole(OPERATOR_ROLE, _operator);
        emit OperatorAdded(_operator);
    }

    /// @inheritdoc IGlobalRegistryService
    function revokeOperator(address _account) external override addressNotZero(_account) onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, _account);
        emit OperatorRevoked(_account);
    }

    function registerInvestor(
        string calldata _id,
        string calldata _collisionHash
    ) public override newInvestor(_id) whenNotPaused onlyRole(OPERATOR_ROLE) returns (bool) {
        address sender = _msgSender();
        investors[_id] = Investor(_id, _collisionHash, sender, "", 0);

        emit InvestorAdded(_id, sender);

        return true;
    }

    function removeInvestor(
        string calldata _id
    ) public override investorExists(_id) whenNotPaused onlyRole(OPERATOR_ROLE) returns (bool) {
        if (investors[_id].walletCount > 0) {
            revert InvestorHasWallets();
        }

        for (uint8 index = 0; index < 16; index++) {
            delete attributes[_id][index];
        }

        delete investors[_id];

        emit InvestorRemoved(_id, msg.sender);

        return true;
    }

    function updateInvestor(
        string calldata _id,
        string calldata _collisionHash,
        string memory _country,
        address[] memory _wallets,
        uint8[] memory _attributeIds,
        uint256[] memory _attributeValues,
        uint256[] memory _attributeExpirations
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool) {
        if (_attributeValues.length != _attributeIds.length) {
            revert ParameterLengthMismatch();
        }
        if (_attributeIds.length != _attributeExpirations.length) {
            revert ParameterLengthMismatch();
        }

        if (!isInvestor(_id)) {
            registerInvestor(_id, _collisionHash);
        }

        if (bytes(_country).length > 0) {
            setCountry(_id, _country);
        }

        for (uint256 i = 0; i < _wallets.length; i++) {
            if (isWallet(_wallets[i]) && !CommonUtils.isEqualString(getInvestor(_wallets[i]), _id)) {
                revert WalletBelongsToAnotherInvestor();
            } else {
                addWallet(_wallets[i], _id);
            }
        }

        for (uint256 i = 0; i < _attributeIds.length; i++) {
            setAttribute(_id, _attributeIds[i], _attributeValues[i], _attributeExpirations[i], "");
        }

        return true;
    }

    function getInvestorDetailsFull(
        string memory _id
    )
        public
        view
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
        string memory country = investors[_id].country;
        uint256[] memory attributeValues = new uint256[](4);
        uint256[] memory attributeExpiries = new uint256[](4);
        string[] memory attributeProofHashes = new string[](4);
        for (uint8 i = 0; i < 4; i++) {
            attributeValues[i] = getAttributeValue(_id, (uint8(2) ** i));
            attributeExpiries[i] = getAttributeExpiry(_id, (uint8(2) ** i));
            attributeProofHashes[i] = getAttributeProofHash(_id, (uint8(2) ** i));
        }
        return (
            country,
            attributeValues,
            attributeExpiries,
            attributeProofHashes[0],
            attributeProofHashes[1],
            attributeProofHashes[2],
            attributeProofHashes[3]
        );
    }

    function setCountry(
        string calldata _id,
        string memory _country
    ) public override investorExists(_id) onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool) {
        string memory prevCountry = getCountry(_id);
        if (!CommonUtils.isEqualString(prevCountry, _country)) {
            investors[_id].country = _country;

            emit DSRegistryServiceInvestorCountryChanged(_id, _country, msg.sender);
        }
        return true;
    }

    function getCountry(string memory _id) public view override returns (string memory) {
        return investors[_id].country;
    }

    function getCollisionHash(string calldata _id) public view override returns (string memory) {
        return investors[_id].collisionHash;
    }

    function setAttribute(
        string calldata _id,
        uint8 _attributeId,
        uint256 _value,
        uint256 _expiry,
        string memory _proofHash
    ) public override investorExists(_id) onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool) {
        if (_attributeId >= 16) {
            revert UnknownAttribute();
        }

        attributes[_id][_attributeId].value = _value;
        attributes[_id][_attributeId].expiry = _expiry;
        attributes[_id][_attributeId].proofHash = _proofHash;

        emit DSRegistryServiceInvestorAttributeChanged(_id, _attributeId, _value, _expiry, _proofHash, msg.sender);

        return true;
    }

    function getAttributeValue(string memory _id, uint8 _attributeId) public view override returns (uint256) {
        return attributes[_id][_attributeId].value;
    }

    function getAttributeExpiry(string memory _id, uint8 _attributeId) public view override returns (uint256) {
        return attributes[_id][_attributeId].expiry;
    }

    function getAttributeProofHash(string memory _id, uint8 _attributeId) public view override returns (string memory) {
        return attributes[_id][_attributeId].proofHash;
    }

    function addWallet(
        address _address,
        string memory _id
    ) public override onlyRole(OPERATOR_ROLE) whenNotPaused investorExists(_id) newWallet(_address) returns (bool) {
        address sender = _msgSender();
        investorsWallets[_address] = Wallet(_id, sender);
        investors[_id].walletCount++;

        emit WalletAdded(_address, _id, sender);

        return true;
    }

    function removeWallet(
        address _address,
        string memory _id
    )
        public
        override
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        walletExists(_address)
        walletBelongsToInvestor(_address, _id)
        returns (bool)
    {
        delete investorsWallets[_address];
        investors[_id].walletCount--;

        emit WalletRemoved(_address, _id, msg.sender);

        return true;
    }

    function getInvestor(address _address) public view override returns (string memory) {
        return investorsWallets[_address].owner;
    }

    function getInvestorDetails(address _address) public view override returns (string memory, string memory) {
        return (getInvestor(_address), getCountry(getInvestor(_address)));
    }

    function isInvestor(string memory _id) public view override returns (bool) {
        return !CommonUtils.isEmptyString(investors[_id].id);
    }

    function isAccreditedInvestor(string calldata _id) external view override returns (bool) {
        return getAttributeValue(_id, ACCREDITED) == APPROVED;
    }

    function isAccreditedInvestor(address _wallet) external view override returns (bool) {
        string memory investor = investorsWallets[_wallet].owner;
        return getAttributeValue(investor, ACCREDITED) == APPROVED;
    }

    function isQualifiedInvestor(address _wallet) external view override returns (bool) {
        string memory investor = investorsWallets[_wallet].owner;
        return getAttributeValue(investor, QUALIFIED) == APPROVED;
    }

    function isQualifiedInvestor(string calldata _id) external view override returns (bool) {
        return getAttributeValue(_id, QUALIFIED) == APPROVED;
    }

    function getInvestors(address _from, address _to) external view override returns (string memory, string memory) {
        return (investorsWallets[_from].owner, investorsWallets[_to].owner);
    }

    function isWallet(address _address) public view override returns (bool) {
        return isInvestor(getInvestor(_address));
    }
}
