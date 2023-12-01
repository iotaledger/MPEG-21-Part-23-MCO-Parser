import { getContractFromMCO } from 'mco-parser';
import commandLineArgs from 'command-line-args';
import fs from 'fs';

interface CommandLineOptions {
	contract: string;
}

const optionDefinitions = [{ name: 'contract', alias: 'c', type: String }];
const options = commandLineArgs(optionDefinitions) as CommandLineOptions;

const contractPath = options.contract;

const main = async () => {
	const ttl = fs.readFileSync(contractPath, 'utf-8');
	const res = await getContractFromMCO(ttl);
	console.log(JSON.stringify(res, null, 2));
};

main();
