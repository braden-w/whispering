import { Storage } from '@plasmohq/storage';
import { Effect, Layer } from 'effect';
import { ExtensionStorageError, ExtensionStorageService } from './ExtensionStorage';

export const ExtensionStorageLive = Layer.effect(
	ExtensionStorageService,
	Effect.gen(function* () {
		const storage = new Storage();
		return {
			get: ({ key, schema, defaultValue }) =>
				Effect.tryPromise({
					try: async () => {
						const unparsedValue = await storage.get(key);
						if (unparsedValue === null) {
							return defaultValue;
						}
						return schema.parse(unparsedValue);
					},
					catch: () => defaultValue,
				}),
			set: ({ key, value }) =>
				Effect.tryPromise({
					try: () => storage.set(key, value),
					catch: (error) => {
						return new ExtensionStorageError({
							message: `Error setting in local storage for key: ${key}`,
							origError: error,
						});
					},
				}),
		};
	}),
);
