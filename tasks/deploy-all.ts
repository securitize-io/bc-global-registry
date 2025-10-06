import { task, types } from 'hardhat/config';
task('deploy-all', 'Global Registry Service Full Deployment')
  .addParam('arg01', 'Arg 01', undefined, types.string, false)
  .setAction(async (args, hre) => {
    await run('compile');

    console.log('DEPLOY ALL', args.arg01);
    return null;
  });
