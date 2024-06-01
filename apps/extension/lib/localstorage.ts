import { Storage } from '@plasmohq/storage';
import { Effect, Layer } from 'effect';
import {
	LocalStorageError,
	LocalStorageService,
} from '../../../packages/services/src/services/localstorage';

export const LocalStorageExtensionLive = Layer.effect(
	LocalStorageService,
	Effect.gen(function* () {
		const storage = new Storage();
		return {
			get: (key) =>
				Effect.tryPromise({
					try: () => storage.get(key),
					catch: (error) => {
						return new LocalStorageError({
							message: `Error getting from local storage for key: ${key}`,
							origError: error,
						});
					},
				}),
			set: (key, value) =>
				Effect.tryPromise({
					try: () => storage.set(key, value),
					catch: (error) => {
						return new LocalStorageError({
							message: `Error setting in local storage for key: ${key}`,
							origError: error,
						});
					},
				}),
		};
	}),
);
