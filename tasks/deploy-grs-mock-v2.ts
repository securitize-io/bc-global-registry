import { task } from 'hardhat/config';

task('deploy-grs-mock-v2', 'Deploy Global Registry Service')
  .setAction(async (args, hre) => {
    await run('compile');
    const GlobalRegistryServiceMockV2 = await hre.ethers.getContractFactory('GlobalRegistryServiceMockV2');
    const grs = await hre.upgrades.deployProxy(GlobalRegistryServiceMockV2, []);
    await grs.waitForDeployment();

    const vaultAddress = await grs.getAddress();
    const vaultImpl = await hre.upgrades.erc1967.getImplementationAddress(vaultAddress);

    console.log(`GlobalRegistryServiceMockV2 Proxy address: ${vaultAddress}`);
    console.log(`GlobalRegistryServiceMockV2 Implementation address: ${vaultImpl}`);

    return grs;
  });
