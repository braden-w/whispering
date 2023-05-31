import { writable } from 'svelte/store';

export const apiKey = createApiKeyStore();

function createApiKeyStore() {
	const initialApiKey = '';
	const apiKeyFromStorage = localStorage.getItem('openai-api-key');
	const { subscribe, set, update } = writable(apiKeyFromStorage || initialApiKey);

	async function setApiKey(apiKey: string) {
		localStorage.setItem('openai-api-key', apiKey);
		set(apiKey);
	}

	return {
		subscribe,
		set: setApiKey,
		update
	};
}
