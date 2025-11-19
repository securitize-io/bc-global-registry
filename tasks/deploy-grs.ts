import { task } from 'hardhat/config';

task('deploy-grs', 'Deploy Global Registry Service')
  .setAction(async (args, hre) => {
    await run('compile');
    const GlobalRegistryService = await hre.ethers.getContractFactory('GlobalRegistryService');
    const grs = await hre.upgrades.deployProxy(GlobalRegistryService, []);
    await grs.waitForDeployment();

    const vaultAddress = await grs.getAddress();
    const vaultImpl = await hre.upgrades.erc1967.getImplementationAddress(vaultAddress);

    console.log(`GlobalRegistryService Proxy address: ${vaultAddress}`);
    console.log(`GlobalRegistryService Implementation address: ${vaultImpl}`);

    return grs;
  });
