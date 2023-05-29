import { writable, type Writable } from 'svelte/store';

import { Storage } from '@plasmohq/storage/dist';

export const options = createApiKeyStore();

type Options = { copyToClipboard: boolean };

function createApiKeyStore() {
	const initialOptions: Options = { copyToClipboard: true };
	const { subscribe, set, update } = writable(initialOptions);
	const storage = new Storage();

	async function init() {
		const optionsFromStorage = await storage.get<Options>('options');
		set(optionsFromStorage || initialOptions);
	}

	async function setOptions(options: Options) {
		await storage.set('options', options);
		set(options);
	}

	return {
		subscribe,
		init,
		set: setOptions,
		update
	};
}
