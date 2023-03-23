import { writable } from 'svelte/store';

export const apiKey = writable(localStorage.getItem('openai-api-key') || '');
