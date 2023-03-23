import { writable } from 'svelte/store';

/**
 * The user's API key is synced in local storage so that it is remembered across
 * sessions.
 */
export const apiKey = writable(localStorage.getItem('openai-api-key') || '');

apiKey.subscribe((value) => {
	localStorage.setItem('openai-api-key', value);
});
