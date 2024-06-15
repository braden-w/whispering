import { Schema as S } from '@effect/schema';
import { Storage } from '@plasmohq/storage';
import { recorderStateSchema, toastOptionsSchema } from '@repo/shared';
import { Data, Effect } from 'effect';
import { z } from 'zod';

export class GetExtensionStorageError<
	K extends keyof typeof extensionSchemas,
> extends Data.TaggedError('GetExtensionStorageError')<{
	key: K;
	defaultValue: S.Schema.Type<(typeof extensionSchemas)[K]>;
	error: unknown;
}> {}

export class SetExtensionStorageError<
	K extends keyof typeof extensionSchemas,
> extends Data.TaggedError('SetExtensionStorageError')<{
	key: K;
	value: S.Schema.Type<(typeof extensionSchemas)[K]>;
	error: unknown;
}> {}

export class WatchExtensionStorageError<
	K extends keyof typeof extensionSchemas,
> extends Data.TaggedError('WatchExtensionStorageError')<{
	key: K;
	error: unknown;
}> {}

const storage = new Storage();

const extensionSchemas = {
	'whispering-recording-state': recorderStateSchema,
	'whispering-toast': toastOptionsSchema.pipe(
		S.extend(
			S.Struct({
				variant: S.Literal('success', 'info', 'loading', 'error'),
			}),
		),
	),
	'whispering-recording-tab-id': z.number(),
	'whispering-latest-recording-transcribed-text': z.string(),
} as const;

export const extensionStorage = {
	get: <K extends keyof typeof extensionSchemas>({
		key,
		defaultValue,
	}: {
		key: K;
		defaultValue: S.Schema.Type<(typeof extensionSchemas)[K]>;
	}): Effect.Effect<S.Schema.Type<(typeof extensionSchemas)[K]>> =>
		Effect.tryPromise({
			try: async () => {
				const unparsedValue = await storage.get(key);
				if (unparsedValue === null) {
					return defaultValue;
				}
				return extensionSchemas[key].parse(unparsedValue);
			},
			catch: (error) =>
				new GetExtensionStorageError({
					key,
					defaultValue,
					error,
				}),
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends keyof typeof extensionSchemas>({
		key,
		value,
	}: {
		key: K;
		value: S.Schema.Type<(typeof extensionSchemas)[K]>;
	}): Effect.Effect<void, SetExtensionStorageError<K>> =>
		Effect.tryPromise({
			try: () => storage.set(key, value),
			catch: (error) => {
				return new SetExtensionStorageError({ key, value, error });
			},
		}),
	watch: <K extends keyof typeof extensionSchemas>({
		key,
		callback,
	}: {
		key: K;
		callback: (newValue: S.Schema.Type<(typeof extensionSchemas)[K]>) => void;
	}) =>
		Effect.try({
			try: () => {
				storage.watch({
					[key]: ({ newValue: newValueUnparsed }) => {
						const newValueParseResult = extensionSchemas[key].safeParse(newValueUnparsed);
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
				new WatchExtensionStorageError({
					key,
					error,
				}),
		}),
} as const;
