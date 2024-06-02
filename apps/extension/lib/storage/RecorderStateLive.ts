import { Effect, Layer } from 'effect';
import { z } from 'zod';
import { ExtensionStorageService } from './ExtensionStorage';
import { RecorderStateService } from './RecorderState';
import { ExtensionStorageLive } from './ExtensionStorageLive';

export const RecorderStateLive = Layer.effect(
	RecorderStateService,
	Effect.gen(function* () {
		const extensionStorageService = yield* ExtensionStorageService;
		return {
			get: () =>
				Effect.gen(function* () {
					return yield* extensionStorageService.get({
						key: 'whispering-recording-state',
						schema: z.union([z.literal('IDLE'), z.literal('RECORDING')]),
						defaultValue: 'IDLE',
					});
				}),
			set: (value) =>
				Effect.gen(function* () {
					yield* extensionStorageService.set({
						key: 'whispering-recording-state',
						value,
					});
				}),
		};
	}),
).pipe(Layer.provide(ExtensionStorageLive));
