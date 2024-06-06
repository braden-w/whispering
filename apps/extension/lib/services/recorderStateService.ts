import { recorderStateSchema, type RecorderState } from './recorder';
import { extensionStorage } from './storage';

export const recorderStateService = {
	get: () =>
		extensionStorage.get({
			key: 'whispering-recording-state',
			schema: recorderStateSchema,
			defaultValue: 'IDLE',
		}),
	set: (value: RecorderState) =>
		extensionStorage.set({
			key: 'whispering-recording-state',
			value,
		}),
} as const;
