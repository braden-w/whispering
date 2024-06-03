import { Effect, Layer } from 'effect';
import { z } from 'zod';
import { ExtensionStorageService } from './ExtensionStorage';
import { RecorderStateService } from './RecorderState';
import { ExtensionStorageLive } from './ExtensionStorageLive';
import { recorderStateSchema } from '../../../../packages/services/src/services/recorder';

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
