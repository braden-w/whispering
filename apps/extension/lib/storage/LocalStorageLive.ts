import { Storage } from '@plasmohq/storage';
import { Effect, Layer } from 'effect';
import {
	LocalStorageError,
	LocalStorageService,
} from '../../../../packages/services/src/services/localstorage';

export const LocalStorageWwwLive = Layer.succeed(
	LocalStorageService,
	LocalStorageService.of({
		get: ({ key, schema, defaultValue }) =>
			Effect.try({
				try: () => {
					const unparsedValue = localStorage.getItem(key);
					if (unparsedValue === null) {
						return defaultValue;
					}
					return schema.parse(unparsedValue);
				},
				catch: () => defaultValue,
			}),
		set: ({ key, value }) =>
			Effect.try({
				try: () => localStorage.setItem(key, value),
				catch: (error) =>
					new LocalStorageError({
						message: `Error setting in local storage for key: ${key}`,
						origError: error,
					}),
			}),
	}),
);

export const LocalStorageExtensionLive = Layer.effect(
	LocalStorageService,
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
					catch: (error) => {
						return new LocalStorageError({
							message: `Error getting from local storage for key: ${key}`,
							origError: error,
						});
					},
				}),
			set: ({ key, value }) =>
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
