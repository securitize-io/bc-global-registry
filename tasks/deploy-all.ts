import { task, types } from 'hardhat/config';
import {ZeroAddress} from "ethers";
task('deploy-all', 'Global Registry Service Full Deployment')
    .addParam('admin', 'New admin address', ZeroAddress, types.string, true)
    .addParam('operator', 'New operator address', ZeroAddress, types.string, true)
    .setAction(async (args, hre) => {
        await run('compile');
        const globalRegistryService = await hre.run('deploy-grs', {});
        if (args.operator !== ZeroAddress) {
            console.log(`===> Adding operator role to ${args.operator}`);
            await globalRegistryService.addOperator(args.operator);
        }
        if (args.admin !== ZeroAddress) {
            console.log(`===> Transferring admin role to ${args.admin}`);
            await globalRegistryService.changeAdmin(args.admin);
        }
        return globalRegistryService;
    });

