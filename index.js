const parseTTL = require('@frogcat/ttl2jsonld').parse;
const lut = require('./lookup-tables/');
const { handleContract, handleMCODeonticExpression } = require('./handlers/');
const { getType } = require('./handlers/lib/Utils');

const formatIntoMediaContractualObjects = (mediaContract) => {
  const finalMCObjects = { contracts: [] };
  // Search for all contract objects
  Object.values(mediaContract).forEach((element) => {
    if (element.class === 'Contract') {
      Object.keys(element).forEach((contractKey) => {
        if (
          element[contractKey] instanceof Array &&
          element[contractKey].length > 0
        ) {
          const temp = {};
          element[contractKey].forEach((arrayElement) => {
            temp[arrayElement] = mediaContract[arrayElement];
          });
          element[contractKey] = temp;
        }
      });
      finalMCObjects.contracts.push(element);
    }
  });

  return finalMCObjects;
};

const getJsonLDGraph = (ttl) => {
  const jsonLDGraph = {};
  const jsonld = parseTTL(ttl);
  jsonld['@graph'].forEach((element) => {
    jsonLDGraph[element['@id']] = element;
  });

  return jsonLDGraph;
};

const getContractFromMCO = async (ttl) => {
  const jsonLDGraph = {};
  const mediaContractualObjects = {};
  const traversedIds = {
    ids: [],
    parties: [],
    objects: [],
    deontics: [],
  };
  const jsonld = parseTTL(ttl);

  jsonld['@graph'].forEach((element) => {
    jsonLDGraph[element['@id']] = element;
  });

  // IPFS
  const { createHelia } = await import('helia');
  const { json } = await import('@helia/json');
  const { CID } = await import('multiformats/cid');
  const helia = await createHelia();
  const remoteStorage = {
    jsonHelia: json(helia),
    CID,
  };

  // Search for all contract objects
  for (element of Object.values(jsonLDGraph)) {
    const classData = lut.AllClasses[getType(element).toLowerCase()];
    if (classData[0] === 'Contract') {
      await handleContract(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        classData,
        element,
        traversedIds
      );
    }
  }

  // Search for all deontic expression objects
  for (element of Object.values(jsonLDGraph)) {
    const classData = lut.AllClasses[getType(element).toLowerCase()];
    if (classData[0] === 'MCODeonticExpression') {
      await handleMCODeonticExpression(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        classData,
        element,
        traversedIds
      );
    }
  }

  await helia.stop();

  return {
    mediaContractualObjects: formatIntoMediaContractualObjects(
      mediaContractualObjects
    ),
    traversedIds,
  };
};

module.exports = { getContractFromMCO, getJsonLDGraph };
