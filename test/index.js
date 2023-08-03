const { getContractFromMCO } = require('..');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const optionDefinitions = [{ name: 'contract', alias: 'c', type: String }];
const options = commandLineArgs(optionDefinitions);

const contractPath = options.contract;
const remoteStorage = 'http://localhost:5000';

const main = async () => {
  const ttl = fs.readFileSync(contractPath, 'utf-8');
  const res = await getContractFromMCO(ttl, remoteStorage);
  console.log(JSON.stringify(res.traversedIds, null, 2));
};

main();
