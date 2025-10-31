import { task, types } from 'hardhat/config';
import {eip712GlobalRegistryService} from './eip-712.helper';
import {Contract, ZeroAddress} from 'ethers';

task('add-investor-eip-712', 'Create a new EIP-712 signed message to add a new investor in GRS')
  .addParam('grsaddress', 'GlobalRegistryService proxy address', undefined, types.string, false)
  .addParam('investorid', 'The id of new investor', undefined, types.string, false)
  .addParam('wallet', 'The wallet of new investor', undefined, types.string, false)
  .setAction(async (args, hre) => {
    await hre.run('compile');

    const [,operator, investor] = await hre.ethers.getSigners(); //configure process.env.OPERATOR_PRIV_KEY
    console.log(`OPERATOR ${await operator.getAddress()}`)
    const globalRegistryService = await hre.ethers.getContractAt('GlobalRegistryService', args.grsaddress);
    if (!await globalRegistryService.isOperator(operator)) {
        throw new Error('Operator not authorized in GRS');
    }
    const block = await hre.ethers.provider.getBlock('latest');
    const blockNumber = block?.number || 0;
    const grsParms = [args.investorid, args.wallet, blockNumber + BLOCK_SPAN];
    const txData = await buildTypedData(globalRegistryService, args.investorid, grsParms);
    const signature = await eip712GlobalRegistryService(hre, operator, await globalRegistryService.getAddress(), txData);
    const tx = await globalRegistryService.connect(investor).executePreApprovedTransaction(signature, txData);
    console.log(`tx: ${tx.hash}`);
  });
export const buildTypedData = async (globalRegistryService: Contract, investorId: string, grsParams: any) => {
    const data = globalRegistryService.interface.encodeFunctionData('addGlobalInvestorWallet', grsParams);
    const nonce = await globalRegistryService.nonceByInvestor(investorId);

    return {
        senderInvestor: investorId,
        destination: await globalRegistryService.getAddress(),
        executor: ZeroAddress,
        data,
        nonce,
        deadline: Math.floor(Date.now() / 1000) + TIME_SPAN_IN_SECONDS,
    };
};
const BLOCK_SPAN = 1000;
const TIME_SPAN_IN_SECONDS = 600; //10 minutes
