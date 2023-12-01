const { getContractFromMCO } = require('../dist/index.min.js');

const fs = require('fs');
const commandLineArgs = require('command-line-args');
const optionDefinitions = [{ name: 'contract', alias: 'c', type: String }];
const options = commandLineArgs(optionDefinitions);

const contractPath = options.contract;

const main = async () => {
  const ttl = fs.readFileSync(contractPath, 'utf-8');
  const res = await getContractFromMCO(ttl);
  console.log(JSON.stringify(res, null, 2));
};

main();
