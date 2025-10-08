import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { deployGRS } from './fixtures/fixture';
import { INVESTORS } from './fixtures/investors-fixture';

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
      .to.emit(globalRegistryService, 'InvestorAdded')
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
      .to.emit(globalRegistryService, 'InvestorAdded')
      .withArgs(INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(true);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    expect(await globalRegistryService['isAccreditedInvestor(address)'](investor)).to.equal(true);
    expect(await globalRegistryService['isAccreditedInvestor(string)'](INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(
      true,
    );
    expect(await globalRegistryService['isQualifiedInvestor(address)'](investor)).to.equal(true);
    expect(await globalRegistryService['isQualifiedInvestor(string)'](INVESTORS.INVESTOR_ID.INVESTOR_ID_1)).to.equal(
      true,
    );
    const details = await globalRegistryService.getInvestorDetailsFull(INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(details[0]).to.equal('');
    expect(details[1][0]).to.equal(0);
    expect(details[1][1]).to.equal(0);
    expect(details[1][2]).to.equal(0);
    expect(details[1][3]).to.equal(0);
    expect(details[2][0]).to.equal(0);
    expect(details[2][1]).to.equal(0);
    expect(details[2][2]).to.equal(0);
    expect(details[3]).to.equal('');
    expect(details[4]).to.equal('');
    expect(details[5]).to.equal('');
  });

  it('Should fail trying to register a new full investor because wallet already exists', async function () {
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
    const details = await globalRegistryService.getInvestorDetailsFull(INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(details.length > 0).to.equal(true);
  });

  it('Should remove an investor', async function () {
    const [owner] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await globalRegistryService.registerInvestor(
      INVESTORS.INVESTOR_ID.INVESTOR_ID_1,
      INVESTORS.INVESTOR_ID.INVESTOR_COLLISION_HASH_1,
    );
    await expect(globalRegistryService.removeInvestor(INVESTORS.INVESTOR_ID.INVESTOR_ID_1))
      .to.emit(globalRegistryService, 'InvestorRemoved')
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
      .to.emit(globalRegistryService, 'WalletAdded')
      .withArgs(investor, INVESTORS.INVESTOR_ID.INVESTOR_ID_1, owner);
    expect(await globalRegistryService.isWallet(investor)).to.equal(true);
    const investorDetails = await globalRegistryService.getInvestorDetails(investor);
    expect(investorDetails[0]).to.equal(INVESTORS.INVESTOR_ID.INVESTOR_ID_1);
    expect(investorDetails[1]).to.equal('');
  });

  it('Trying to add wallet an not existing investor', async function () {
    const [, investor] = await hre.ethers.getSigners();
    const { globalRegistryService } = await loadFixture(deployGRS);
    await expect(globalRegistryService.addWallet(investor, 'nonExistingInvestorId')).to.revertedWith(
      'Unknown investor',
    );
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
      .to.emit(globalRegistryService, 'WalletRemoved')
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
  it('Should return empty strings', async () => {
    const { globalRegistryService } = await loadFixture(deployGRS);
    expect(await globalRegistryService.getCountry('id')).to.equal('');
    expect(await globalRegistryService.getCollisionHash('id')).to.equal('');
  });
});
