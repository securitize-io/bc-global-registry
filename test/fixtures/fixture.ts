import hre from 'hardhat';

export const deployGRS = async () => {
  const globalRegistryService = await hre.run('deploy-grs', {});
  const [owner] = await hre.ethers.getSigners();
  await globalRegistryService.addOperator(owner);

  const globalRegistryServiceMockV2 = await hre.run('deploy-grs-mock-v2', {});
  return {
    globalRegistryService,
    globalRegistryServiceMockV2,
  };
};
