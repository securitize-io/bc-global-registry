import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { deployGRS } from './fixtures/fixture';
import hre from 'hardhat';

describe('Global Registry Service - Add Operator', () => {
  it('Add a new operator wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const [owner, newOperator] = await hre.ethers.getSigners();
    await expect(globalRegistryService.connect(owner).addOperator(newOperator))
      .to.emit(globalRegistryService, 'OperatorAdded')
      .withArgs(newOperator);

    expect(await globalRegistryService.isOperator(newOperator)).to.be.true;
  });
});
