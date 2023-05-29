import { writable, type Writable } from 'svelte/store';

import { Storage } from '@plasmohq/storage/dist';

export const options: Writable<Options> = createApiKeyStore();

type Options = { copyToClipboard: boolean };

function createApiKeyStore() {
	const initialOptions: Options = { copyToClipboard: true };
	const storage = new Storage();

	const { subscribe, set, update } = writable(initialOptions);
	storage.get<Options>('options').then((options) => {
		set(options || initialOptions);
	});

	async function updateOptions(options: Options) {
		await storage.set('options', options);
		set(options);
	}

	return {
		subscribe,
		set: updateOptions,
		update
	};
}
