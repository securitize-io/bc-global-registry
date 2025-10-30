import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { deployGRS } from './fixtures/fixture';
import hre from 'hardhat';
import { ZeroAddress } from 'ethers';

describe('Global Registry Service - Add Operator', () => {
  it('Add a new operator wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, newOperator] = await hre.ethers.getSigners();
    expect(await globalRegistryService.isOperator(newOperator)).to.be.false;
    await expect(globalRegistryService.connect(owner).addOperator(newOperator))
      .to.emit(globalRegistryService, 'OperatorAdded')
      .withArgs(newOperator);

    expect(await globalRegistryService.isOperator(newOperator)).to.be.true;
  });
  it('Revert when account already has operator role', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [, newOperator] = await hre.ethers.getSigners();
    await globalRegistryService.addOperator(newOperator)
    await expect(globalRegistryService.addOperator(newOperator)).to.be.revertedWithCustomError(
        globalRegistryService,
        'RoleAlreadyAssigned',
    );
  });
  it('Revert when signer has not the required role assigned', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, unauthorizedWallet] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(unauthorizedWallet).addOperator(owner)).to.be.revertedWithCustomError(
      globalRegistryService,
      'AccessControlUnauthorizedAccount',
    );
  });
  it('Revert if account is zero address', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(owner).addOperator(ZeroAddress)).to.be.revertedWithCustomError(
      globalRegistryService,
      'ZeroAddressInvalid',
    );
  });
});

describe('Global Registry Service - Revoke Operator', () => {
  it('Revoke a operator wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, newOperator] = await hre.ethers.getSigners();
    await globalRegistryService.connect(owner).addOperator(newOperator);
    expect(await globalRegistryService.isOperator(newOperator)).to.be.true;
    await expect(globalRegistryService.connect(owner).revokeOperator(newOperator))
      .to.emit(globalRegistryService, 'OperatorRevoked')
      .withArgs(newOperator);

    expect(await globalRegistryService.isOperator(newOperator)).to.be.false;
  });
  it('Revert when account has not the correct role assigned', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [, oldOperator] = await hre.ethers.getSigners();
    await expect(globalRegistryService.revokeOperator(oldOperator)).to.be.revertedWithCustomError(
        globalRegistryService,
        'RoleNotAssigned',
    );
  });
  it('Revert when signer has not the correct role assigned', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, unauthorizedWallet] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(unauthorizedWallet).revokeOperator(owner)).to.be.revertedWithCustomError(
      globalRegistryService,
      'AccessControlUnauthorizedAccount',
    );
  });
  it('Revert if account is zero address', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(owner).revokeOperator(ZeroAddress)).to.be.revertedWithCustomError(
      globalRegistryService,
      'ZeroAddressInvalid',
    );
  });
});

describe('Global Registry Service - Change admin', () => {
  it('Change admin', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, newAdmin] = await hre.ethers.getSigners();
    expect(await globalRegistryService.isAdmin(newAdmin)).to.be.false;
    await expect(globalRegistryService.connect(owner).changeAdmin(newAdmin))
      .to.emit(globalRegistryService, 'AdminChanged')
      .withArgs(newAdmin);

    expect(await globalRegistryService.isAdmin(newAdmin)).to.be.true;
  });
  it('Revert when signer has not the required role assigned', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, unauthorizedWallet] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(unauthorizedWallet).changeAdmin(owner)).to.be.revertedWithCustomError(
      globalRegistryService,
      'AccessControlUnauthorizedAccount',
    );
  });
  it('Revert if account is zero address', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(owner).changeAdmin(ZeroAddress)).to.be.revertedWithCustomError(
      globalRegistryService,
      'ZeroAddressInvalid',
    );
  });
});
