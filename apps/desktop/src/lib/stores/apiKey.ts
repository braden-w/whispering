import { createStoreSyncedWithStorage } from './createStore';

export const apiKey = createStoreSyncedWithStorage<string>({
	key: 'openai-api-key',
	initialValue: ''
});
