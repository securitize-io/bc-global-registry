import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { deployGRS } from './fixtures/fixture';
import { INVESTORS } from './fixtures/investors-fixture';
import { Contract, ZeroAddress } from 'ethers';
import { eip712GlobalRegistryService } from '../tasks/eip-712.helper';

export const buildTypedData = async (globalRegistryService: Contract, investorId: string, grsParams: any) => {
  const data = globalRegistryService.interface.encodeFunctionData('addGlobalInvestorWallet', grsParams);
  const nonce = await globalRegistryService.nonceByInvestor(investorId);

  return {
    senderInvestor: investorId,
    destination: await globalRegistryService.getAddress(),
    executor: hre.ethers.ZeroAddress,
    data,
    nonce,
  };
};

describe('CRUD investor', function () {
  const US = 'US';
  const GB = 'GB';
  it('Should register the new investor', async function () {
    const [owner] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.registerInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      ),
    )
      .to.emit(globalRegistryService, 'GlobalInvestorAdded')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
  });

  it('Should register the new full investor', async function () {
    const [owner, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);

    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        [investor],
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    )
      .to.emit(globalRegistryService, 'GlobalInvestorAdded')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
  });

  it('Should fail trying to register a global investor and the wallet belongs to another investor', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.updateInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      US,
      [investor],
      [1, 2, 4],
      [1, 1, 1],
      [0, 0, 0],
    );

    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_2,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        [investor],
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'WalletBelongsToAnotherInvestor');
  });

  it('Should revert with too many wallets', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    const wallets = [];
    for (let i = 0; i < 300; i++) {
      wallets.push(hre.ethers.Wallet.createRandom().address);
    }
    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        wallets,
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'TooManyWallets');
  });

  it('Should revert with too max Wallets reached', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    let wallets = [];
    for (let i = 0; i < 254; i++) {
      wallets.push(hre.ethers.Wallet.createRandom().address);
    }
    await globalRegistryService.updateInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      US,
      wallets,
      [1, 2, 4],
      [1, 1, 1],
      [0, 0, 0],
    );
    wallets = [hre.ethers.Wallet.createRandom().address, hre.ethers.Wallet.createRandom().address];
    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        wallets,
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'MaxWalletsReached');
  });

  it('Should fail trying to register a global investor and the zero address', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        [ZeroAddress],
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'ZeroAddressInvalid');
  });

  it('Should update the investor', async function () {
    const [, investor, investor2] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.updateInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      US,
      [investor],
      [1, 2, 4],
      [1, 1, 1],
      [0, 0, 0],
    );
    await globalRegistryService.updateInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      GB,
      [investor2],
      [1, 2, 4],
      [1, 1, 1],
      [0, 0, 0],
    );
  });

  it('Should remove an investor', async function () {
    const [owner] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(globalRegistryService.removeInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'GlobalInvestorRemoved')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
  });

  it('Should remove an investor', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    await expect(
      globalRegistryService.removeInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'InvestorHasWallets');
  });

  it('Trying to remove an not existing investor', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.removeInvestor('nonExistingInvestorId')).to.revertedWith('Unknown investor');
  });

  it('Trying to register an investor with empty id - should be an error', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.registerInvestor('', INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1),
    ).to.revertedWith('Investor id must not be empty');
  });

  it('Trying to register the same account twice - should be an error', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(
      globalRegistryService.registerInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      ),
    ).revertedWith('Investor already exists');
  });

  it('Trying to register the new investor using an account with unauthorized wallet', async function () {
    const [, unauthorizedWallet] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService
        .connect(unauthorizedWallet)
        .registerInvestor(
          INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
          INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });

  it('Trying to register the new investor using an account with unauthorized wallet', async function () {
    const [, unauthorizedWallet, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService
        .connect(unauthorizedWallet)
        .updateInvestor(
          INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
          INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
          US,
          [investor],
          [1, 2, 4],
          [1, 1, 1],
          [0, 0, 0],
        ),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });

  it('Trying to remove the new investor using an account with unauthorized wallet', async function () {
    const [, unauthorizedWallet] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(
      globalRegistryService.connect(unauthorizedWallet).removeInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });

  it('Should not allow register investor when GlobalRegistryService is paused', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.pause();
    await expect(
      globalRegistryService.registerInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      ),
    ).to.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
  });

  it('Should not allow update investor when GlobalRegistryService is paused', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.pause();
    const [, investor] = await hre.ethers.getSigners();
    await expect(
      globalRegistryService.updateInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
        US,
        [investor],
        [1, 2, 4],
        [1, 1, 1],
        [0, 0, 0],
      ),
    ).to.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
  });

  it('Should not allow remove investor when GlobalRegistryService is paused', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.pause();
    await expect(globalRegistryService.removeInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.revertedWithCustomError(
      globalRegistryService,
      'EnforcedPause',
    );
  });
});

describe('Wallets', function () {
  it('Trying to add the wallet', async function () {
    const [owner, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    expect(await globalRegistryService.isWallet(investor)).to.equal(false);

    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'GlobalWalletAdded')
      .withArgs(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    const holderFromBc = await globalRegistryService.getInvestorDetails(investor);
    expect(holderFromBc[0]).to.equal(INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(holderFromBc[1]).to.equal('');
  });

  it('Trying to add wallet an not existing investor', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.addWallet(investor, 'nonExistingInvestorId')).to.revertedWith(
      'Unknown investor',
    );
  });

  it('Trying to add wallet with zero addrress', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(
      globalRegistryService.addWallet(ZeroAddress, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).revertedWithCustomError(globalRegistryService, 'ZeroAddressInvalid');
  });

  it('Trying to remove a wallet', async function () {
    const [owner, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    await expect(globalRegistryService.removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'GlobalWalletRemoved')
      .withArgs(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isWallet(investor)).to.equal(false);
  });
  it('Trying to add the wallet with unauthorized wallet', async function () {
    const [, unauthorized, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.connect(unauthorized).addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });

  it('should revert with MaxWalletsReached when adding wallet over the limit', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    for (let i = 0; i < 255; i++) {
      const extraWallet = hre.ethers.Wallet.createRandom().address;
      await globalRegistryService.addWallet(extraWallet, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    }
    await expect(
      globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'MaxWalletsReached');
  });

  it('Trying to remove the wallet with unauthorized wallet', async function () {
    const [, unauthorized, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.connect(unauthorized).removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });
  it('Trying to remove the wallet with zero address', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.removeWallet(ZeroAddress, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'ZeroAddressInvalid');
  });
  it('Should not allow add wallet when GlobalRegistryService is paused', async () => {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.pause();
    await expect(
      globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
  });

  it('Should not allow remove wallet when GlobalRegistryService is paused', async () => {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    await globalRegistryService.pause();
    await expect(
      globalRegistryService.removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
  });

  it('Trying to add the same wallet - should be an error', async function () {
    const [investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    await expect(globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.revertedWith(
      'Wallet already exists',
    );
  });

  it('Trying to remove the wallet from the investor that does not exist - should be an error', async function () {
    const [investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.revertedWith(
      'Unknown wallet',
    );
  });

  it('Trying to remove the wallet with the wrong investor - should be an error', async function () {
    const [investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    await expect(globalRegistryService.removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_2)).to.revertedWith(
      'Wallet does not belong to investor',
    );
  });

  it('Trying to remove the wallet that does not exist - should be an error', async function () {
    const [investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(globalRegistryService.removeWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.revertedWith(
      'Unknown wallet',
    );
  });

  it('Trying to return information about two investors', async function () {
    const [, investor, investor2] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    expect(await globalRegistryService.isWallet(investor)).to.equal(false);
    expect(await globalRegistryService.isWallet(investor2)).to.equal(false);

    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_2,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_2,
    );
    await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    await globalRegistryService.addWallet(investor2, INVESTORS.INVESTOR_ID.INVESTOR_ID_2);
    const investors = await globalRegistryService.getInvestors(investor, investor2);
    expect(investors[0]).to.equal(INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(investors[1]).to.equal(INVESTORS.INVESTOR_ID.INVESTOR_ID_2);
  });
});

describe('Not implemented features', function () {
  it('Should throw not implemented when trying to set attribute', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.setAttribute('id', 1, 1, 1, 'hash')).to.be.revertedWithCustomError(
      globalRegistryService,
      'NotImplemented',
    );
  });
  it('Should throw not implemented when trying to set attribute', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.setCountry('id', 'FR')).to.be.revertedWithCustomError(
      globalRegistryService,
      'NotImplemented',
    );
  });
  it('Should throw not implemented when trying to get country', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.getCountry('id')).to.be.revertedWithCustomError(
      globalRegistryService,
      'NotImplemented',
    );
  });
  it('Should throw not implemented when trying to get collision hash', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.getCollisionHash('id')).to.be.revertedWithCustomError(
      globalRegistryService,
      'NotImplemented',
    );
  });
  it('Should throw not implemented when trying to get investor detail', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.getInvestorDetailsFull('id')).to.be.revertedWithCustomError(
      globalRegistryService,
      'NotImplemented',
    );
  });
  it('Should throw not implemented when trying to get attribute value', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.getAttributeValue(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying to get attribute expiry', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.getAttributeExpiry(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying to get attribute proof hash', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.getAttributeProofHash(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying if investor if accredited with wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService['isAccreditedInvestor(address)']('0x0000000000000000000000000000000000000001'),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying check if investor if accredited', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService['isAccreditedInvestor(string)'](INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying check if investor if qualified with wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService['isQualifiedInvestor(address)']('0x0000000000000000000000000000000000000001'),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
  it('Should throw not implemented when trying check if investor if qualified with wallet', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService['isQualifiedInvestor(string)'](INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'NotImplemented');
  });
});

describe('Pre Approved Transactions', function () {
  let blockNumber: number;
  beforeEach(async function () {
    const block = await hre.ethers.provider.getBlock('latest');
    blockNumber = block?.number || 0;
  });
  describe('addGlobalInvestorWallet method', function () {
    it('Should not allow add a global investor wallet when GlobalRegistryService is paused', async () => {
      const [, investor] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      await globalRegistryService.pause();
      await expect(
        globalRegistryService.addGlobalInvestorWallet(
          INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
          investor,
          blockNumber + 1000,
        ),
      ).to.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
    });

    it('Should fail to add global investor wallet if caller is not the same contract', async function () {
      const [, investor] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      await expect(
        globalRegistryService.addGlobalInvestorWallet(
          INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
          investor,
          blockNumber + 1000,
        ),
      ).revertedWithCustomError(globalRegistryService, 'OnlySelfError');
    });
    it('Should register the new global investor wallet', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber + 1000];
      await globalRegistryService.addOperator(operator);
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );

      await expect(globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData))
        .emit(globalRegistryService, 'GlobalInvestorAdded')
        .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await globalRegistryService.getAddress())
        .emit(globalRegistryService, 'GlobalWalletAdded')
        .withArgs(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await globalRegistryService.getAddress());

      expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
      expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    });
    it('Should register the new global investor wallet when blockNumber is in the edge value', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber];
      await globalRegistryService.addOperator(operator);
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );

      await expect(globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData))
        .emit(globalRegistryService, 'GlobalInvestorAdded')
        .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await globalRegistryService.getAddress())
        .emit(globalRegistryService, 'GlobalWalletAdded')
        .withArgs(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await globalRegistryService.getAddress());

      expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
      expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    });
    it('Should fail trying to add a global zero address wallet', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, ZeroAddress, blockNumber + 5000];
      await globalRegistryService.addOperator(operator);
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );
      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.be.revertedWithCustomError(globalRegistryService, 'ZeroAddressInvalid');
    });
    it('Should fail trying to add a global wallet with a transaction too old', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber - 1];
      await globalRegistryService.addOperator(operator);
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );
      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.be.revertedWithCustomError(globalRegistryService, 'TransactionTooOld');
    });
    it('Should fail trying to add a global wallet without permissions', async function () {
      const [, investor, unauthorizedWallet] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      // First registration
      await globalRegistryService.registerInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 'hash1');
      await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
      // Second registration with the same wallet but different investor id
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_2, await investor.getAddress(), blockNumber + 1000];
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_2, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        unauthorizedWallet,
        await globalRegistryService.getAddress(),
        txData,
      );

      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.be.revertedWithCustomError(globalRegistryService, 'InvalidEIP712Signature');
    });
    it('Should fail trying to register wallet that already exist', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      await globalRegistryService.addOperator(operator);
      // First registration
      await globalRegistryService.registerInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 'hash1');
      await globalRegistryService.addWallet(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
      // Second registration with the same wallet but different investor id
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_2, await investor.getAddress(), blockNumber + 1000];
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_2, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );

      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.revertedWith('Wallet already exists');
    });
    it('should revert with MaxWalletsReached when adding global investor wallet', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      await globalRegistryService.addOperator(operator);
      await globalRegistryService.registerInvestor(
        INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
        INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
      );
      for (let i = 0; i < 255; i++) {
        const extraWallet = hre.ethers.Wallet.createRandom().address;
        await globalRegistryService.addWallet(extraWallet, INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
      }
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber + 1000];
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_2, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );
      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.be.revertedWithCustomError(globalRegistryService, 'MaxWalletsReached');
    });
    it('executePreApprovedTransaction should revert when GlobalRegistryService is paused', async function () {
      const [, investor, operator] = await hre.ethers.getSigners();
      const { globalRegistryService } = await loadFixture(deployGRS);
      await globalRegistryService.pause();
      await globalRegistryService.addOperator(operator);
      const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber + 1000];
      const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_2, grsParams);
      const signature = await eip712GlobalRegistryService(
        hre,
        operator,
        await globalRegistryService.getAddress(),
        txData,
      );
      await expect(
        globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData),
      ).to.be.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
    });
  });
});

describe('Increment nonce by investor', function () {
  it('Should increment nonce by investor with a new wallet', async function () {
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
    expect(await globalRegistryService.nonceByInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(0);

    await expect(globalRegistryService.incrementInvestorNonce(INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'InvestorNonceIncremented')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 1);
  });
  it('Should increment a positive nonce', async function () {
    const [owner, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    const block = await hre.ethers.provider.getBlock('latest');
    const blockNumber = block?.number || 0;
    const grsParams = [INVESTORS.INVESTOR_ID.INVESTOR_ID_1, await investor.getAddress(), blockNumber + 5];
    await globalRegistryService.addOperator(owner);
    const txData = await buildTypedData(globalRegistryService, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, grsParams);
    const signature = await eip712GlobalRegistryService(hre, owner, await globalRegistryService.getAddress(), txData);

    await globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData);
    expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    expect(await globalRegistryService.nonceByInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(1);

    await expect(globalRegistryService.incrementInvestorNonce(INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'InvestorNonceIncremented')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, 2);
  });
  it('Should revert when GlobalRegistryService is paused', async function () {
    const [, operator] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.pause();
    await globalRegistryService.addOperator(operator);
    await expect(
      globalRegistryService.connect(operator).incrementInvestorNonce(INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'EnforcedPause');
  });
  it('Should revert when signer is not an operator', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(
      globalRegistryService.connect(investor).incrementInvestorNonce(INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.be.revertedWithCustomError(globalRegistryService, 'AccessControlUnauthorizedAccount');
  });
  it('Should revert when investor id is not registered', async function () {
    const [, operator] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.addOperator(operator);
    await expect(
        globalRegistryService.connect(operator).incrementInvestorNonce(INVESTORS.INVESTOR_ID.INVESTOR_ID_1),
    ).to.revertedWith('Unknown investor');
  });
});
