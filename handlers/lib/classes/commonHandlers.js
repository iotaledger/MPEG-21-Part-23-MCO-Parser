// To avoid module exports inside circular dependency
const { addElement } = require('../../../generators/lib/AddElement');
const generators = require('../../../generators/');
const { addToObjectsSet, getType, parsed, obtainObject } = require('../Utils');
const lut = require('../../../lookup-tables/');

const { handleTextClause } = require('./TextClause');
const { handleInterval } = require('./Interval');
const { handleTrack } = require('./Track');

const handleMCODeonticExpression = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate a deontic object
  const deonticObj = generators.generateMCODeonticExpression(
    classData,
    element
  );
  traversedIds.ids.push(deonticObj.identifier);
  traversedIds.deontics.push(deonticObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, deonticObj.identifier, deonticObj);

  // update contract
  const referencedContract = mediaContractualObjects[deonticObj.issuedIn];
  addElement(
    { deontics: 'array' },
    referencedContract,
    'deontics',
    deonticObj.identifier
  );
  // update party issuer
  const partyEle = await obtainObject(
    remoteStorage,
    jsonLDGraph,
    deonticObj.issuer
  );
  const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
  await handleParty(
    remoteStorage,
    jsonLDGraph,
    mediaContractualObjects,
    partyClassData,
    partyEle,
    deonticObj.issuedIn,
    traversedIds
  );
  const referencedParty = mediaContractualObjects[deonticObj.issuer];
  addElement(
    { deonticsIssued: 'array' },
    referencedParty,
    'deonticsIssued',
    deonticObj.identifier
  );
  //generate action
  if (deonticObj.act !== undefined) {
    const actEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      deonticObj.act,
      traversedIds
    );
    const actClassData = lut.AllClasses[getType(actEle).toLowerCase()];
    await handleAction(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      actClassData,
      actEle,
      deonticObj.issuedIn,
      traversedIds
    );
    // update from action
    const actionObj = mediaContractualObjects[actEle['@id']];
    addElement(
      { actedBySubject: 'string' },
      deonticObj,
      'actedBySubject',
      actionObj.actedBy
    );
    if (actionObj.actedOver !== undefined) {
      //TODO SERVICE
      for (const ipentityId of actionObj.actedOver) {
        addElement(
          { actObjects: 'array' },
          deonticObj,
          'actObjects',
          ipentityId
        );
        const ipentityEle = await obtainObject(
          remoteStorage,
          jsonLDGraph,
          ipentityId
        );
        const ipentityClassData =
          lut.AllClasses[getType(ipentityEle).toLowerCase()];
        await handleIPEntity(
          remoteStorage,
          jsonLDGraph,
          mediaContractualObjects,
          ipentityClassData,
          ipentityEle,
          deonticObj.issuedIn,
          traversedIds
        );
      }
    }
    if (actionObj.resultsIn !== undefined) {
      for (const ipentityId of actionObj.resultsIn) {
        addElement(
          { resultantObject: 'array' },
          deonticObj,
          'resultantObject',
          ipentityId
        );
        const ipentityEle = await obtainObject(
          remoteStorage,
          jsonLDGraph,
          ipentityId
        );
        const ipentityClassData =
          lut.AllClasses[getType(ipentityEle).toLowerCase()];
        await handleIPEntity(
          remoteStorage,
          jsonLDGraph,
          mediaContractualObjects,
          ipentityClassData,
          ipentityEle,
          deonticObj.issuedIn,
          traversedIds
        );
      }
    }
  }

  // traverse related elements
  if (deonticObj.textClauses !== undefined) {
    for (const textClauseId of deonticObj.textClauses) {
      const textClauseEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        textClauseId
      );
      const textClauseClassData =
        lut.AllClasses[getType(textClauseEle).toLowerCase()];
      handleTextClause(
        jsonLDGraph,
        mediaContractualObjects,
        textClauseClassData,
        textClauseEle,
        deonticObj.issuedIn,
        traversedIds
      );
    }
  }
  if (deonticObj.constraints !== undefined) {
    for (const factId of deonticObj.constraints) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        deonticObj.issuedIn,
        traversedIds
      );
    }
  }
};

const handleIPEntity = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  parentContractId,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate an IPEntity object
  const ipentityObj = generators.generateIPEntity(classData, element);
  traversedIds.ids.push(ipentityObj.identifier);
  traversedIds.objects.push(ipentityObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, ipentityObj.identifier, ipentityObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  addElement(
    { objects: 'array' },
    referencedContract,
    'objects',
    ipentityObj.identifier
  );

  // traverse related elements
  if (ipentityObj.rightsOwners !== undefined) {
    for (const partyId of ipentityObj.rightsOwners) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.isMadeUpOf !== undefined) {
    for (const ipentityId of ipentityObj.isMadeUpOf) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.resultedFrom !== undefined) {
    for (const actionId of ipentityObj.resultedFrom) {
      const actEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        actionId,
        traversedIds
      );
      const actClassData = lut.AllClasses[getType(actEle).toLowerCase()];
      await handleAction(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        actClassData,
        actEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.segments !== undefined) {
    for (const ipentityId of ipentityObj.segments) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.tracks !== undefined) {
    for (const trackid of ipentityObj.tracks) {
      const trackEle = await obtainObject(remoteStorage, jsonLDGraph, trackid);
      const trackClassData = lut.AllClasses[getType(trackEle).toLowerCase()];
      handleTrack(
        jsonLDGraph,
        mediaContractualObjects,
        trackClassData,
        trackEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.intervals !== undefined) {
    for (const intervalId of ipentityObj.intervals) {
      const intervalEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        intervalId
      );
      const intervalClassData =
        lut.AllClasses[getType(intervalEle).toLowerCase()];
      await handleInterval(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        intervalClassData,
        intervalEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.segmentOf !== undefined) {
    const ipentityEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      ipentityObj.segmentOf
    );
    const ipentityClassData =
      lut.AllClasses[getType(ipentityEle).toLowerCase()];
    await handleIPEntity(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      ipentityClassData,
      ipentityEle,
      parentContractId,
      traversedIds
    );
  }
  if (ipentityObj.contains !== undefined) {
    for (const ipentityId of ipentityObj.contains) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (ipentityObj.onTrack !== undefined) {
    for (const trackid of ipentityObj.onTrack) {
      const trackEle = await obtainObject(remoteStorage, jsonLDGraph, trackid);
      const trackClassData = lut.AllClasses[getType(trackEle).toLowerCase()];
      handleTrack(
        jsonLDGraph,
        mediaContractualObjects,
        trackClassData,
        trackEle,
        parentContractId,
        traversedIds
      );
    }
  }
};

const handleParty = async (
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
  const partyObj = generators.generateParty(classData, element);
  traversedIds.ids.push(partyObj.identifier);
  traversedIds.parties.push(partyObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, partyObj.identifier, partyObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  if (!referencedContract.parties.includes(partyObj.identifier)) {
    addElement(
      { otherPersonUsers: 'array' },
      referencedContract,
      'otherPersonUsers',
      partyObj.identifier
    );
  }

  // traverse related elements
  if (partyObj.actOnBehalfOf !== undefined) {
    for (const partyId of partyObj.actOnBehalfOf) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (partyObj.belongsToCollective !== undefined) {
    for (const partyId of partyObj.belongsToCollective) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (partyObj.isRightsOwnerOf !== undefined) {
    for (const ipentityId of partyObj.isRightsOwnerOf) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (partyObj.signatory !== undefined) {
    const partyEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      partyObj.signatory
    );
    const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
    await handleParty(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      partyClassData,
      partyEle,
      parentContractId,
      traversedIds
    );
  }
};

const handleFact = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  parentContractId,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate a fact object
  const factObj = generators.generateFact(classData, element);
  traversedIds.ids.push(factObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, factObj.identifier, factObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  addElement(
    { facts: 'array' },
    referencedContract,
    'facts',
    factObj.identifier
  );

  // traverse related elements
  if (factObj.composedFacts !== undefined) {
    for (const factId of factObj.composedFacts) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.makesTrue !== undefined) {
    for (const actionEventId of factObj.makesTrue) {
      const actEventEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        actionEventId,
        traversedIds
      );
      const actEventClassData =
        lut.AllClasses[getType(actEventEle).toLowerCase()];
      if (actEventClassData[0] === 'IPEntity') {
        await handleIPEntity(
          remoteStorage,
          jsonLDGraph,
          mediaContractualObjects,
          actEventClassData,
          actEventEle,
          parentContractId,
          traversedIds
        );
      } else {
        await handleAction(
          remoteStorage,
          jsonLDGraph,
          mediaContractualObjects,
          actEventClassData,
          actEventEle,
          parentContractId,
          traversedIds
        );
      }
    }
  }
  if (factObj.withIPEntity !== undefined) {
    const ipentityEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      factObj.withIPEntity
    );
    const ipentityClassData =
      lut.AllClasses[getType(ipentityEle).toLowerCase()];
    await handleIPEntity(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      ipentityClassData,
      ipentityEle,
      parentContractId,
      traversedIds
    );
  }
  if (factObj.partOf !== undefined) {
    for (const ipentityId of factObj.partOf) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  // personal data
  if (factObj.hasDataController !== undefined) {
    const partyEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      factObj.hasDataController
    );
    const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
    await handleParty(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      partyClassData,
      partyEle,
      parentContractId,
      traversedIds
    );
  }
  if (factObj.hasDataSubject !== undefined) {
    const partyEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      factObj.hasDataSubject
    );
    const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
    await handleParty(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      partyClassData,
      partyEle,
      parentContractId,
      traversedIds
    );
  }
  if (factObj.hasLegalBasis !== undefined) {
    for (const factId of factObj.hasLegalBasis) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasPersonalData !== undefined) {
    for (const ipentityId of factObj.hasPersonalData) {
      const ipentityEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        ipentityId
      );
      const ipentityClassData =
        lut.AllClasses[getType(ipentityEle).toLowerCase()];
      await handleIPEntity(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        ipentityClassData,
        ipentityEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasPersonalDataHandling !== undefined) {
    for (const factId of factObj.hasPersonalDataHandling) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasProcessing !== undefined) {
    for (const factId of factObj.hasProcessing) {
      const actionEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const actionClassData = lut.AllClasses[getType(actionEle).toLowerCase()];
      await handleAction(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        actionClassData,
        actionEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasPurpose !== undefined) {
    for (const factId of factObj.hasPurpose) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasRecipient !== undefined) {
    for (const factId of factObj.hasRecipient) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, factId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasRight !== undefined) {
    for (const factId of factObj.hasRight) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasRisk !== undefined) {
    for (const factId of factObj.hasRisk) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (factObj.hasTechnicalOrganisationalMeasure !== undefined) {
    for (const factId of factObj.hasTechnicalOrganisationalMeasure) {
      const factEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        factId,
        traversedIds
      );
      const factClassData = lut.AllClasses[getType(factEle).toLowerCase()];
      await handleFact(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        factClassData,
        factEle,
        parentContractId,
        traversedIds
      );
    }
  }
};

const handleAction = async (
  remoteStorage,
  jsonLDGraph,
  mediaContractualObjects,
  classData,
  element,
  parentContractId,
  traversedIds
) => {
  if (parsed(mediaContractualObjects, element)) return;
  // generate an action object
  const actionObj = generators.generateAction(classData, element);
  traversedIds.ids.push(actionObj.identifier);
  // save the object
  addToObjectsSet(mediaContractualObjects, actionObj.identifier, actionObj);

  // update contract
  const referencedContract = mediaContractualObjects[parentContractId];
  addElement(
    { actions: 'array' },
    referencedContract,
    'actions',
    actionObj.identifier
  );
  // update party
  if (actionObj.actedBy !== undefined) {
    const partyEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      actionObj.actedBy
    );
    const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
    await handleParty(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      partyClassData,
      partyEle,
      parentContractId,
      traversedIds
    );
    const referencedParty = mediaContractualObjects[actionObj.actedBy];
    addElement(
      { actionsIsSubject: 'array' },
      referencedParty,
      'actionsIsSubject',
      actionObj.identifier
    );
  }

  // traverse related elements
  if (actionObj.impliesAlso !== undefined) {
    for (const actId of actionObj.impliesAlso) {
      const actEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        actId,
        traversedIds
      );
      const actClassData = lut.AllClasses[getType(actEle).toLowerCase()];
      await handleAction(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        actClassData,
        actEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (actionObj.rightGivenBy !== undefined) {
    for (const partyId of actionObj.rightGivenBy) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (actionObj.sellsDeontic !== undefined) {
    const deonticEle = await obtainObject(
      remoteStorage,
      jsonLDGraph,
      actionObj.sellsDeontic
    );
    const deonticClassData = lut.AllClasses[getType(deonticEle).toLowerCase()];
    await handleMCODeonticExpression(
      remoteStorage,
      jsonLDGraph,
      mediaContractualObjects,
      deonticClassData,
      deonticEle,
      traversedIds
    );
  }
  if (actionObj.recipients !== undefined) {
    for (const partyId of actionObj.recipients) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (actionObj.beneficiaries !== undefined) {
    for (const partyId of actionObj.beneficiaries) {
      const partyEle = await obtainObject(remoteStorage, jsonLDGraph, partyId);
      const partyClassData = lut.AllClasses[getType(partyEle).toLowerCase()];
      await handleParty(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        partyClassData,
        partyEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (actionObj.incomeSources !== undefined) {
    for (const actId of actionObj.incomeSources) {
      const actEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        actId,
        traversedIds
      );
      const actClassData = lut.AllClasses[getType(actEle).toLowerCase()];
      await handleAction(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        actClassData,
        actEle,
        parentContractId,
        traversedIds
      );
    }
  }
  if (actionObj.isAbout !== undefined) {
    for (const actId of actionObj.isAbout) {
      const actEle = await obtainObject(
        remoteStorage,
        jsonLDGraph,
        actId,
        traversedIds
      );
      const actClassData = lut.AllClasses[getType(actEle).toLowerCase()];
      await handleAction(
        remoteStorage,
        jsonLDGraph,
        mediaContractualObjects,
        actClassData,
        actEle,
        parentContractId,
        traversedIds
      );
    }
  }
};

module.exports = {
  handleMCODeonticExpression,
  handleIPEntity,
  handleParty,
  handleFact,
  handleAction,
};
