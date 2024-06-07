import { extensionStorage } from './extension-storage';
import { type RecorderState } from './recorder';

export const recorderStateService = {
	get: () =>
		extensionStorage.get({
			key: 'whispering-recording-state',
			defaultValue: 'IDLE',
		}),
	set: (value: RecorderState) =>
		extensionStorage.set({
			key: 'whispering-recording-state',
			value,
		}),
} as const;
