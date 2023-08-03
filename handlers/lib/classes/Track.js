const { addElement } = require('../../../generators/lib/AddElement');
const generators = require('../../../generators/');
const { addToObjectsSet, getType, parsed } = require('../Utils');
const lut = require('../../../lookup-tables/');

const handleTrack = (
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  parentContractId,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate a track object
  const trackObj = generators.generateTrack(classData, element);
  traversedIds.ids.push(trackObj.identifier);
  traversedIds.objects.push(trackObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, trackObj.identifier, trackObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  addElement(
    { objects: 'array' },
    referencedContract,
    'objects',
    trackObj.identifier
  );
};

module.exports = { handleTrack };
