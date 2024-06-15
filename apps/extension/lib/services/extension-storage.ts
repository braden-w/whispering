import { Schema as S } from '@effect/schema';
import { Storage, type StorageWatchCallback } from '@plasmohq/storage';
import { RecorderState, toastOptionsSchema } from '@repo/shared';
import { Console, Data, Effect } from 'effect';

const keyToSchema = {
	'whispering-recording-state': RecorderState,
	'whispering-toast': toastOptionsSchema,
	'whispering-recording-tab-id': S.Number,
	'whispering-latest-recording-transcribed-text': S.String,
} as const;

type Keys = keyof typeof keyToSchema;

type KeyToType<K extends Keys> = S.Schema.Type<(typeof keyToSchema)[K]>;

export class GetExtensionStorageError<K extends Keys> extends Data.TaggedError(
	'GetExtensionStorageError',
)<{
	key: K;
	defaultValue: KeyToType<K>;
	error: unknown;
}> {}

export class SetExtensionStorageError<K extends Keys> extends Data.TaggedError(
	'SetExtensionStorageError',
)<{
	key: K;
	value: KeyToType<K>;
	error: unknown;
}> {}

export class WatchExtensionStorageError<K extends Keys> extends Data.TaggedError(
	'WatchExtensionStorageError',
)<{
	key: K;
	error: unknown;
}> {}

const storage = new Storage();

export const extensionStorage = {
	get: <K extends Keys>({ key, defaultValue }: { key: K; defaultValue: KeyToType<K> }) =>
		Effect.gen(function* () {
			const unparsedValue = yield* Effect.tryPromise({
				try: () => storage.get<unknown>(key),
				catch: (error) =>
					new GetExtensionStorageError({
						key,
						defaultValue,
						error,
					}),
			});
			if (unparsedValue === null || unparsedValue === undefined) return defaultValue;
			const thisKeyValueSchema = S.asSchema(keyToSchema[key]);
			return yield* S.decodeUnknown(thisKeyValueSchema)(unparsedValue);
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends Keys>({
		key,
		value,
	}: {
		key: K;
		value: S.Schema.Type<(typeof keyToSchema)[K]>;
	}): Effect.Effect<void, SetExtensionStorageError<K>> =>
		Effect.tryPromise({
			try: () => storage.set(key, value),
			catch: (error) => {
				return new SetExtensionStorageError({ key, value, error });
			},
		}),
	watch: <K extends Keys>({
		key,
		callback,
	}: {
		key: K;
		callback: (newValue: S.Schema.Type<(typeof keyToSchema)[K]>) => void;
	}) => {
		const thisKeyValueSchema = S.asSchema(keyToSchema[key]);
		const listener: StorageWatchCallback = ({ newValue: newValueUnparsed }) =>
			Effect.gen(function* () {
				const newValue = yield* S.decodeUnknown(thisKeyValueSchema)(newValueUnparsed);
				yield* Console.log('watch', key, newValue);
				callback(newValue);
			}).pipe(Effect.runSync);
		return Effect.try({
			try: () => storage.watch({ [key]: listener }),
			catch: (error) => new WatchExtensionStorageError({ key, error }),
		});
	},
} as const;
