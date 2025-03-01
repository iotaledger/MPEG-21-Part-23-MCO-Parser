const { addElement } = require('../AddElement');
const { Timeline: lut } = require('../../../lookup-tables');
const { timelineObj } = require('../types/Timeline');

const generateTimeline = (classData, payload) => {
  const obj = { class: classData[0] };
  let modelObj = timelineObj;

  Object.keys(payload).forEach((k) => {
    if (lut[k.toLowerCase()] !== undefined)
      addElement(modelObj, obj, lut[k.toLowerCase()], payload[k], k);
    else if (k !== '@type')
      console.warn('Warning! Left out:' + payload[k] + ', because:' + k); //addElement(modelObj, obj, 'extra', payload[k], k);
  });

  return obj;
};

module.exports = { generateTimeline };
