import hre from 'hardhat';

export const deployGRS = async () => {
  const globalRegistryService = await hre.run('deploy-grs', {});

  return {
    globalRegistryService,
  };
};
