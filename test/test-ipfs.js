const { HeliaOfflineStorage: HeliaOffChainStorage, OffChainStorage: OffChainStorage } = require('../storage/offChainStorage');

const offlineStorage = async () => {
  const offChainStorage = new OffChainStorage();
  await offChainStorage.start();
  const cidUrl = await offChainStorage.publish('a');
  console.log(`response from new offline storage ${JSON.stringify(cidUrl)}`)


  const response = await offChainStorage.retrieve(cidUrl);
  console.log(`response from new offline storage ${JSON.stringify(response)}`)


  offChainStorage.stop();
};


const heliaOfflineStorage = async () => {
  const offChainStorage = new HeliaOffChainStorage();
  await offChainStorage.start();
  const cidUrl = await offChainStorage.publish('a');
  console.log(`response from helia: ${JSON.stringify(cidUrl)}`)



  const response = await offChainStorage.retrieve(cidUrl);
  console.log(`response from helia: ${JSON.stringify(response)}`)


  offChainStorage.stop();
};



offlineStorage().then(() => console.log("done ofline storage"))
heliaOfflineStorage().then(() => console.log("done helia"))
