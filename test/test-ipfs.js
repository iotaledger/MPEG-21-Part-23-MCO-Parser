const { HeliaOfflineStorage: HeliaOffChainStorage, OffChainStorage: OffChainStorage } = require('../storage/offChainStorage');

const offlineStorage = async () => {
  console.log("===========NEw storage ===========")
  const offChainStorage = new OffChainStorage();
  await offChainStorage.start();
  const cidUrl = await offChainStorage.publish('a');
  console.log(`response from new offline storage ${JSON.stringify(cidUrl)}`)


  const response = await offChainStorage.retrieve(cidUrl);
  console.log(`response from new offline storage ${JSON.stringify(response)}`)


  offChainStorage.stop();
};


const heliaOfflineStorage = async () => {
  console.log("============Helia offline stroage ==========")

  const offChainStorage = new HeliaOffChainStorage();
  await offChainStorage.start();
  const cidUrl = await offChainStorage.publish('a');
  console.log(`response from helia: ${JSON.stringify(cidUrl)}`)



  const response = await offChainStorage.retrieve(cidUrl);
  console.log(`response from helia: ${JSON.stringify(response)}`)


  offChainStorage.stop();
};



const heliaIPFS = async () => {
  const { createHelia } = await import('helia');
  const { json } = await import('@helia/json');
  const { CID } = await import('multiformats/cid');

  const helia = await createHelia();
  await helia.start()
  const jsonHelia = json(helia);



  await helia.stop()



}

offlineStorage().then(() => console.log("done ofline storage"))
heliaOfflineStorage().then(() => console.log("done helia"))
