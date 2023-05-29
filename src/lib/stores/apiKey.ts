import { writable, type Writable } from 'svelte/store';

import { Storage } from '@plasmohq/storage/dist';

export const apiKey: Writable<string> = createApiKeyStore();

function createApiKeyStore() {
	const storage = new Storage();

	const { subscribe, set, update } = writable('');
	storage.get('openai-api-key').then((apiKey) => {
		set(apiKey || '');
	});

	async function updateApiKey(apiKey: string) {
		await storage.set('openai-api-key', apiKey);
		set(apiKey);
	}

	return {
		subscribe,
		set: updateApiKey,
		update
	};
}
