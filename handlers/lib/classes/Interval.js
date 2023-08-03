const { addElement } = require('../../../generators/lib/AddElement');
const generators = require('../../../generators/');
const { addToObjectsSet, getType, parsed, obtainObject } = require('../Utils');
const lut = require('../../../lookup-tables/');
const { handleTimeline } = require('./Timeline');

const handleInterval = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  parentContractId,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate a party object
  const intervalObj = generators.generateInterval(classData, element);
  traversedIds.ids.push(intervalObj.identifier);
  traversedIds.objects.push(intervalObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, intervalObj.identifier, intervalObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  addElement(
    { objects: 'array' },
    referencedContract,
    'objects',
    intervalObj.identifier
  );
  // generate timeline
  if (intervalObj.onTimeline !== undefined) {
    const timelineEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      intervalObj.onTimeline
    );
    const timelineClassData =
      lut.AllClasses[getType(timelineEle).toLowerCase()];
    handleTimeline(
      jsonLDGraph,
      mediaContractualObjects,
      timelineClassData,
      timelineEle,
      parentContractId,
      traversedIds
    );
    // update from action
    const timelineObj = mediaContractualObjects[timelineEle['@id']];
    addElement(
      { onTimeline: 'string' },
      intervalObj,
      'onTimeline',
      JSON.stringify(timelineObj) //TODO tests
    );
  }
};

module.exports = { handleInterval };
