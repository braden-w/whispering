import { writable } from 'svelte/store';

export const apiKey = writable(localStorage.getItem('openai-api-key') || '');

export function setApiKey(inputApiKey: string) {
	localStorage.setItem('openai-api-key', inputApiKey);
	apiKey.set(inputApiKey);
}
