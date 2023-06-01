import { createStore } from './createStore';

export const apiKey = createStore('openai-api-key', '');
export const outputText = createStore('output-text', '');
export const audioSrc = createStore('audio-src', '');
