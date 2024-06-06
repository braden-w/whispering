import { Effect, Layer } from 'effect';
import { extensionStorage } from './storage';
import { recorderStateSchema } from './RecorderService';
import { RecorderStateService } from './RecorderState';

export const RecorderStateLive = Layer.effect(
	RecorderStateService,
	Effect.gen(function* () {
		return {
			get: () =>
				extensionStorage.get({
					key: 'whispering-recording-state',
					schema: recorderStateSchema,
					defaultValue: 'IDLE',
				}),
			set: (value) =>
				extensionStorage.set({
					key: 'whispering-recording-state',
					value,
				}),
		};
	}),
);
