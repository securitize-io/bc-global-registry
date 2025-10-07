import hre from 'hardhat';

export const deployGRS = async () => {
  const globalRegistryService = await hre.run('deploy-grs', {});
  const [owner] = await hre.ethers.getSigners();
  await globalRegistryService.addOperator(owner);
  return {
    globalRegistryService,
  };
};
