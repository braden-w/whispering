import { Effect, Layer } from 'effect';
import { ExtensionStorageService } from './ExtensionStorage';
import { ExtensionStorageLive } from './ExtensionStorageLive';
import { RecorderStateService } from './RecorderState';
import { recorderStateSchema } from './RecorderService';

export const RecorderStateLive = Layer.effect(
	RecorderStateService,
	Effect.gen(function* () {
		const extensionStorageService = yield* ExtensionStorageService;
		return {
			get: () =>
				extensionStorageService.get({
					key: 'whispering-recording-state',
					schema: recorderStateSchema,
					defaultValue: 'IDLE',
				}),
			set: (value) =>
				extensionStorageService.set({
					key: 'whispering-recording-state',
					value,
				}),
		};
	}),
).pipe(Layer.provide(ExtensionStorageLive));
