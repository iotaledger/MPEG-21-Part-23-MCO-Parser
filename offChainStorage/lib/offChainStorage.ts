const defaultIPFSGateway = 'https://api.ipfs.iota-ec.net'


interface OffChainStorage {
	// Starts the off-chain storage
	start(): Promise<void>;
	// Publishes the payload to the off-chain storage and returns the ipfs://<cid> url
	publish(payload: Object | string): Promise<string>;
	// Retrieves the payload from the off-chain storage. cid should be in the format ipfs://<cid>
	retrieve(cid: string): Promise<Object>;
	// Stops the off-chain storage
	stop(): Promise<void>;
}


export class HeliaOffChainStorage implements OffChainStorage {
	private helia: any;
	private jsonHelia: any;
	private CID: any;

	constructor() {
		this.helia = {};
		this.jsonHelia = {};
		this.CID = {};
	}

	async start(): Promise<void> {
		const { createHelia } = await import('helia');
		const { json } = await import('@helia/json');
		const { CID } = await import('multiformats/cid');

		this.helia = await createHelia();
		this.jsonHelia = json(this.helia);
		this.CID = CID;

	}

	async publish(payload: Object | string): Promise<string> {
		console.log('[IPFS] Publishing payload');
		console.debug("HeliaOffChainStorage:publish()")

		if (typeof payload !== 'object') payload = { payload };
		const result = 'ipfs://' + (await this.jsonHelia.add(payload)).toString();
		console.log('[IPFS] Published ', result);
		return result;
	}

	async retrieve(cid: string): Promise<Object> {
		console.log('[IPFS] Retrieving ', cid);
		console.debug("HeliaOffChainStorage:retrieve()")
		cid = cid.split('/').slice(-1)[0];
		const parsedCID = this.CID.parse(cid);
		return await this.jsonHelia.get(parsedCID);
	}

	async stop() {
		await this.helia.stop();
	}
}

export class IPFSOffChainStorage {
	private gatewayURL: string;
	private client: any;
	private CID: any;

	constructor(gatewayURL) {
		this.gatewayURL = gatewayURL || defaultIPFSGateway;
		this.CID = {}
	}

	async start() {
		const { create } = await import('ipfs-http-client');
		this.client = create({ url: this.gatewayURL });
		const { CID } = await import('multiformats/cid');
		this.CID = CID;
	}

	// Publishes the payload to the off-chain storage and returns the ipfs://<cid> url
	async publish(payload: Object | string): Promise<string> {
		console.log('[IPFS] Publishing payload ', payload)
		console.debug("OffChainStorage:publish() ", this.gatewayURL)
		console.debug('[IPFS] Publishing payload: ', payload)
		if (typeof payload !== 'object') payload = { payload };
		try {
			const response = await this.client.add(JSON.stringify(payload))
			console.debug(`returning response: ${response}`)

			return 'ipfs://' + response.cid.toString()
		} catch (err) {

			console.error(`error while publishing payload ot IPFS: ${JSON.stringify(err)} `)
			throw err
		}
	}

	/// retrieves the payload from the off-chain storage. cid should be in the format ipfs://<cid>
	async retrieve(cid: string): Promise<Object> {
		console.log('[IPFS] Retrieving ', cid);
		console.debug("OffChainStorage:retrieve() ", this.gatewayURL)
		cid = cid.split('/').slice(-1)[0];
		const parsedCID = this.CID.parse(cid);

		const chunks: Buffer[] = [];
		for await (const chunk of this.client.cat(parsedCID)) {
			chunks.push(chunk);
		}

		const data = Buffer.concat(chunks).toString('utf-8');
		const response = JSON.parse(data)

		return response
	}

	async stop() {
		// in case of IPFS, we don't need to stop anything
	}
}

