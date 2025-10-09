import { task, types } from 'hardhat/config';
import {ZeroAddress} from "ethers";
import {INVESTORS} from "../test/fixtures/investors-fixture";
import {eip712GlobalRegistryService} from "../test/eip-712.helper";
import {buildTypedData} from "../test/global-registry-service.test";
const BLOCK_SPAN = 1000;
task('add-global-investor-eip-712-sign', 'Create a new EIP-712 signed message to add a new investor in GRS')
  .addParam('grsaddress', 'GlobalRegistryService proxy address', undefined, types.string, false)
  .addParam('investorid', 'The id of new investor', undefined, types.string, false)
  .addParam('wallet', 'The wallet of new investor', undefined, types.string, false)
  .setAction(async (args, hre) => {
    await run('compile');

    const [,operator] = await hre.ethers.getSigners(); //configure process.env.OPERATOR_PRIV_KEY
    const globalRegistryService = await hre.ethers.getContractAt('GlobalRegistryService', args.grsaddress);
    if (!await globalRegistryService.isOperator(operator)) {
        throw new Error('Operator not authorized in GRS');
    }
    const block = await hre.ethers.provider.getBlock('latest');
    const blockNumber = block?.number || 0;
    const grsParms = [args.investorid, args.wallet, blockNumber + BLOCK_SPAN];
    await globalRegistryService.addOperator(operator);
    const txData = await buildTypedData(globalRegistryService, args.investorid, grsParms);
    const signature = await eip712GlobalRegistryService(operator, await globalRegistryService.getAddress(), txData);


  });
