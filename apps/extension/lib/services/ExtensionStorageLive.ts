import { Storage } from '@plasmohq/storage';
import { Effect, Layer } from 'effect';
import { ExtensionStorageError, ExtensionStorageService } from './ExtensionStorage';
import { z } from 'zod';

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
					catch: (error) =>
						new ExtensionStorageError({
							message: `Error getting from local storage for key: ${key}`,
							origError: error,
						}),
				}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
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
			watch: ({ key, schema, callback }) =>
				Effect.try({
					try: () => {
						const changeSchema = z.object({
							newValue: schema.optional(),
							oldValue: schema.optional(),
						});
						storage.watch({
							key: (unparsedChange) => {
								const parseResult = changeSchema.safeParse(unparsedChange);
								if (!parseResult.success) {
									console.error(`Error parsing change for key: ${key}`, parseResult.error.errors);
									return Effect.succeed(undefined);
								}
								const change = parseResult.data;
								callback(change).pipe(Effect.runSync);
							},
						});
					},
					catch: (error) =>
						new ExtensionStorageError({
							message: `Error watching local storage for key: ${key}`,
							origError: error,
						}),
				}),
		};
	}),
);
