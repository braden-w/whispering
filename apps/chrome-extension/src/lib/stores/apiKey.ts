import { createStoreSyncedWithStorage } from './createStore';

export const apiKey = createStoreSyncedWithStorage({ key: 'openai-api-key', initialValue: '' });
