import { writable, type Writable } from 'svelte/store';

import { Storage } from '@plasmohq/storage/dist';

export const apiKey= createApiKeyStore();

function createApiKeyStore() {
	const initialApiKey = '';
	const { subscribe, set, update } = writable(initialApiKey);
	const storage = new Storage();

	async function init() {
		const apiKeyFromStorage = await storage.get('openai-api-key');
		set(apiKeyFromStorage || initialApiKey);
	}

	async function updateApiKey(apiKey: string) {
		await storage.set('openai-api-key', apiKey);
		set(apiKey);
	}

	return {
		subscribe,
		init,
		set: updateApiKey,
		update
	};
}
