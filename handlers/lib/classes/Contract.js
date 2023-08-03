const { addElement } = require('../../../generators/lib/AddElement');
const generators = require('../../../generators/');
const { addToObjectsSet, getType, parsed, obtainObject } = require('../Utils');
const lut = require('../../../lookup-tables/');
const { handleParty } = require('./Party');

const handleContract = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  traversedIds
) => {
  // generate a contract object
  const contractObj = generators.generateContract(classData, element);
  traversedIds.ids.push(contractObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, contractObj.identifier, contractObj);
  // generate all the contract's party objects
  if (contractObj.parties !== undefined) {
    // search for all parties
    for (const partyId of contractObj.parties) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        contractObj.identifier,
        traversedIds
      );
    }
  }
};

module.exports = { handleContract };
