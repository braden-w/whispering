import { Storage } from '@plasmohq/storage/dist';
import { writable } from 'svelte/store';

export const apiKey = createApiKeyStore();
export const outputText = createOutputTextStore();
export const audioSrc = createAudioSrcStore();

function createApiKeyStore() {
	const initialApiKey = '';
	const { subscribe, set, update } = writable(initialApiKey);
	const storage = new Storage();

	async function init() {
		const apiKeyFromStorage = await storage.get('openai-api-key');
		set(apiKeyFromStorage || initialApiKey);
	}

	async function setApiKey(apiKey: string) {
		await storage.set('openai-api-key', apiKey);
		set(apiKey);
	}

	return {
		subscribe,
		init,
		set: setApiKey,
		update
	};
}

function createOutputTextStore() {
	const initialOutputText = '';
	const { subscribe, set, update } = writable(initialOutputText);
	const storage = new Storage();

	async function init() {
		const outputTextFromStorage = await storage.get('output-text');
		set(outputTextFromStorage || initialOutputText);
	}

	async function setOutputText(text: string) {
		await storage.set('output-text', text);
		set(text);
	}

	return {
		subscribe,
		init,
		set: setOutputText,
		update
	};
}

function createAudioSrcStore() {
	const initialAudioSrc = '';
	const { subscribe, set, update } = writable(initialAudioSrc);
	const storage = new Storage();

	async function init() {
		const audioSrcFromStorage = await storage.get('audio-src');
		set(audioSrcFromStorage || initialAudioSrc);
	}

	async function setAudioSrc(src: string) {
		await storage.set('audio-src', src);
		set(src);
	}

	return {
		subscribe,
		init,
		set: setAudioSrc,
		update
	};
}
