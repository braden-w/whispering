import { Storage } from '@plasmohq/storage';
import { Data, Effect } from 'effect';
import type { z } from 'zod';

export class ExtensionStorageError extends Data.TaggedError('ExtensionStorageError')<{
	message: string;
	origError?: unknown;
}> {}

const storage = new Storage();

type ExtensionKey =
	| 'whispering-recording-state'
	| 'whispering-toast'
	| 'whispering-settings'
	| 'whispering-recording-tab-id';

export const extensionStorage = {
	get: <TSchema extends z.ZodTypeAny>({
		key,
		schema,
		defaultValue,
	}: {
		key: ExtensionKey;
		schema: TSchema;
		defaultValue: z.infer<TSchema>;
	}): Effect.Effect<z.infer<TSchema>> =>
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
	set: <T>({
		key,
		value,
	}: {
		key: ExtensionKey;
		value: T;
	}): Effect.Effect<void, ExtensionStorageError> =>
		Effect.tryPromise({
			try: () => storage.set(key, value),
			catch: (error) => {
				return new ExtensionStorageError({
					message: `Error setting in local storage for key: ${key}`,
					origError: error,
				});
			},
		}),
	watch: <TSchema extends z.ZodTypeAny>({
		key,
		schema,
		callback,
	}: {
		key: ExtensionKey;
		schema: TSchema;
		callback: (newValue: z.infer<TSchema>) => void;
	}) =>
		Effect.try({
			try: () => {
				storage.watch({
					[key]: ({ newValue: newValueUnparsed }) => {
						const newValueParseResult = schema.safeParse(newValueUnparsed);
						if (!newValueParseResult.success) {
							console.error(
								`Error parsing change for key: ${key}`,
								newValueParseResult.error.errors,
							);
							return;
						}
						const newValue = newValueParseResult.data;
						callback(newValue);
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
