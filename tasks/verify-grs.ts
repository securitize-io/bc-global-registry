import { task, types } from 'hardhat/config';

task('verify-grs', 'Verify Global Registry Service')
    .addParam('proxy', 'GlobalRegistryService proxy address', undefined, types.string, false)
    .setAction(async (args, { run, ethers }) => {
        const grsProxy = await ethers.getContractAt('GlobalRegistryService', args.proxy);
        const implementation = await grsProxy.getImplementationAddress();

        console.log(`Verifying GlobalRegistryService implementation ${implementation}`);
        await run("verify:verify", {
            address: implementation,
            constructorArguments: [],
        });
    });
