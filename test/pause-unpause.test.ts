import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {deployGRS} from "./fixtures/fixture";
import {expect} from "chai";
import hre from "hardhat";

describe(`GlobalRegistryService - pause / unpause`, () => {
    it(`Should pause a GlobalRegistryService contract`, async () => {
        const { globalRegistryService } = await loadFixture(deployGRS);
        await expect(globalRegistryService.pause()).to.emit(globalRegistryService, 'Paused');
        expect(await globalRegistryService.paused()).to.equal(true);
    });

    it('Revert when signer is has not admin role', async () => {
        const { globalRegistryService } = await loadFixture(deployGRS);
        const [, unauthorizedWallet] = await hre.ethers.getSigners();
        await expect(globalRegistryService.connect(unauthorizedWallet).pause()).to.be.revertedWithCustomError(
            globalRegistryService,
            'AccessControlUnauthorizedAccount',
        );
        await expect(globalRegistryService.connect(unauthorizedWallet).unpause()).to.be.revertedWithCustomError(
            globalRegistryService,
            'AccessControlUnauthorizedAccount',
        );
    });

    it(`Should unpause a GlobalRegistryService contract`, async () => {
        const { globalRegistryService } = await loadFixture(deployGRS);
        await globalRegistryService.pause();
        expect(await globalRegistryService.paused()).to.equal(true);
        await expect(globalRegistryService.unpause()).to.emit(globalRegistryService, 'Unpaused');
        expect(await globalRegistryService.paused()).to.equal(false);
    });
});
