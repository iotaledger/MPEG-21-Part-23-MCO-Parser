const addToObjectsSet = (objectsSet, key, value) => {
  if (objectsSet[key] === undefined) objectsSet[key] = value;
  else objectsSet[key] = { ...objectsSet[key], value };
};

const getType = (element) => {
  if (element['@type'] instanceof Array) {
    return element['@type'][0];
  } else if (typeof element['@type'] === 'string') {
    return element['@type'];
  } else {
    throw new Error('Get type error');
  }
};

const parsed = (mediaContractualObjects, element) => {
  return (
    mediaContractualObjects[element['@id']] !== undefined &&
    mediaContractualObjects[element['@id']]['identifier'] !== undefined
  );
};

const obtainObject = async (remoteStorage, localJSONLDGraph, objectId) => {
  let obj = localJSONLDGraph[objectId];
  if (obj !== undefined) {
    return obj;
  } else {
    let response;
    try {
      cid = objectId.split('/').slice(-1)[0];
      const parsedCID = remoteStorage.CID.parse(cid);
      response = await Promise.race([
        remoteStorage.jsonHelia.get(parsedCID),
        new Promise((resolve, _) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        }),
      ]);
    } catch (error) {
      throw new Error(`${objectId} ${error}`);
    }

    console.log(response);

    if (response !== undefined) {
      return response;
    } else {
      throw new Error(`${objectId} Not found`);
    }
  }
};

const obtainActionFact = async (
  remoteStorage,
  localJSONLDGraph,
  objectId,
  traversedIds
) => {
  let obj = localJSONLDGraph[objectId];
  if (obj !== undefined) {
    return obj;
  } else {
    let response = await fetch(
      remoteStorage + '/api/v1/objects/rdf/' + objectId
    );
    response = await response.json();
    if (response.status === undefined) {
      let response2 = await fetch(
        remoteStorage + '/api/v1/objects/rdf/deonticParent/' + objectId
      );
      response2 = await response2.json();
      if (response2.status === undefined) {
        traversedIds.deontics.push(response2.deonticIdentifier);
        return response;
      }
    } else {
      throw new Error(`${objectId} ${response.message}`);
    }
  }
};

module.exports = {
  addToObjectsSet,
  getType,
  parsed,
  obtainObject,
  obtainActionFact,
};
