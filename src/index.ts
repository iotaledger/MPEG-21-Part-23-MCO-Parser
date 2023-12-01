const parseTTL = require('@frogcat/ttl2jsonld').parse;
const lut = require('../lookup-tables');
const { handleContract, handleMCODeonticExpression } = require('../handlers');
const { getType } = require('../handlers/lib/Utils');
const { OffChainStorage } = require('../offChainStorage');

interface Element {
  class: string;
  [key: string]: any;
}

interface MediaContract {
  [key: string]: Element;
}

interface FinalMCObjects {
  contracts: Element[];
}

const formatIntoMediaContractualObjects = (mediaContract: MediaContract): FinalMCObjects => {
  const finalMCObjects: FinalMCObjects = { contracts: [] };
  // Search for all contract objects
  Object.values(mediaContract).forEach((element: Element) => {
    if (element.class === 'Contract') {
      Object.keys(element).forEach((contractKey) => {
        if (
          element[contractKey] instanceof Array &&
          element[contractKey].length > 0
        ) {
          const temp: { [key: string]: Element } = {};
          element[contractKey].forEach((arrayElement: string | number) => {
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

const getJsonLDGraph = (ttl: string) => {
  const jsonLDGraph: { [key: string]: any } = {};
  const jsonld = parseTTL(ttl);
  jsonld['@graph'].forEach((element: { [key: string]: any }) => {
    jsonLDGraph[element['@id']] = element;
  });

  return jsonLDGraph;
};

const getContractFromMCO = async (ttl: string) => {
  const jsonLDGraph: { [key: string]: any } = {};
  const mediaContractualObjects: { [key: string]: any } = {};
  const traversedIds = {
    ids: [],
    parties: [],
    objects: [],
    deontics: [],
  };
  const jsonld = parseTTL(ttl);

  jsonld['@graph'].forEach((element: { [key: string]: any }) => {
    jsonLDGraph[element['@id']] = element;
  });

  // IPFS
  const { CID } = await import('multiformats/cid');

  const offChainStorage = new OffChainStorage();
  const remoteStorage = {
    jsonHelia: new OffChainStorage(),
    CID,
  };
  await offChainStorage.start();

  // Search for all contract objects
  for (const element of Object.values(jsonLDGraph)) {
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
  for (const element of Object.values(jsonLDGraph)) {
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

  await offChainStorage.stop();

  return {
    mediaContractualObjects: formatIntoMediaContractualObjects(
      mediaContractualObjects
    ),
    traversedIds,
  };
};

export { getContractFromMCO, getJsonLDGraph, OffChainStorage };
