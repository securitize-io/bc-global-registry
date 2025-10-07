import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { deployGRS } from './fixtures/fixture';
import hre from 'hardhat';

describe(`Global Registry Service initialize`, () => {
  it('Should throw if already initialized', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.initialize()).to.be.revertedWithCustomError(
      globalRegistryService,
      'InvalidInitialization',
    );
  });
  it('Should throw if trying to initialize the implementation contract', async () => {
    await loadFixture(deployGRS);
    const GlobalRegistryService = await hre.ethers.getContractFactory('GlobalRegistryService');
    const grsAddress = await hre.upgrades.deployImplementation(GlobalRegistryService);
    const grsImplementationAddress = GlobalRegistryService.attach(grsAddress);
    await expect(grsImplementationAddress.initialize()).to.be.revertedWithCustomError(
      grsImplementationAddress,
      'UUPSUnauthorizedCallContext',
    );
  });
  it('Should throw if trying to initialize the implementation contract of a proxy', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const implementation = await hre.upgrades.erc1967.getImplementationAddress(
      await globalRegistryService.getAddress(),
    );
    const GlobalRegistryService = await hre.ethers.getContractFactory('GlobalRegistryService');
    const grsImplementation = GlobalRegistryService.attach(implementation);
    await expect(grsImplementation.initialize()).to.be.revertedWithCustomError(
      grsImplementation,
      'UUPSUnauthorizedCallContext',
    );
  });
  it('Should throw if trying to initialize the implementation contract', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const implementation = await globalRegistryService.getImplementationAddress();
    const GlobalRegistryService = await hre.ethers.getContractFactory('GlobalRegistryService');
    const grsImplementation = GlobalRegistryService.attach(implementation);
    await expect(grsImplementation.initialize()).to.be.revertedWithCustomError(
      grsImplementation,
      'UUPSUnauthorizedCallContext',
    );
  });
});
