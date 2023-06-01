import { createStoreSyncedWithStorage } from './createStore';

export const apiKey = createStoreSyncedWithStorage({ key: 'openai-api-key', initialValue: '' });
export const outputText = createStoreSyncedWithStorage({ key: 'output-text', initialValue: '' });
export const audioSrc = createStoreSyncedWithStorage({ key: 'audio-src', initialValue: '' });
