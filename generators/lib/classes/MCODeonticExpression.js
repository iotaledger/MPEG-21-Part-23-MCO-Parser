const { addElement } = require('../AddElement');
const lut = require('../../../lookup-tables/lib/classes/MCODeonticExpression');

const mcoDeonticExpressionObj = {
  identifier: 'string',
  type: 'string',
  issuedIn: 'string',
  metadata: 'map',
  textClauses: 'array',
  act: 'string',
  actedBySubject: 'string',
  actObjects: 'array',
  resultantObject: 'array',
  constraints: 'array',
  issuer: 'string',
  extra: 'map',
};
const mcoPermissionObj = {
  ...mcoDeonticExpressionObj,
  percentage: 'number',
  incomePercentage: 'number',
  isExclusive: 'boolean',
  hasSublicenseRight: 'boolean',
};

const generateMCODeonticExpression = (classData, payload) => {
  const obj = {};
  let modelObj = mcoDeonticExpressionObj;
  let deonticType = 'MCODeonticExpression';

  if (classData.length > 1) {
    deonticType = classData[1];
    switch (classData[1]) {
      case 'MCOPermission':
        modelObj = mcoPermissionObj;
        break;
      default:
        break;
    }
  }
  addElement(modelObj, obj, 'type', deonticType);

  Object.keys(payload).forEach((k) => {
    if (lut[k.toLowerCase()] !== undefined)
      addElement(modelObj, obj, lut[k.toLowerCase()], payload[k], k);
    else if (k !== '@type') addElement(modelObj, obj, 'extra', payload[k], k);
  });

  return obj;
};

module.exports = { generateMCODeonticExpression };
