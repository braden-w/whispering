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

type Key = keyof typeof keyToSchema;

type KeyToType<K extends Key> = S.Schema.Type<(typeof keyToSchema)[K]>;

export class GetExtensionStorageError<K extends Key> extends Data.TaggedError(
	'GetExtensionStorageError',
)<{
	key: K;
	defaultValue: KeyToType<K>;
	error: unknown;
}> {}

export class SetExtensionStorageError<K extends Key> extends Data.TaggedError(
	'SetExtensionStorageError',
)<{
	key: K;
	value: KeyToType<K>;
	error: unknown;
}> {}

export class WatchExtensionStorageError<K extends Key> extends Data.TaggedError(
	'WatchExtensionStorageError',
)<{
	key: K;
	error: unknown;
}> {}

const storage = new Storage();

export const extensionStorage = {
	get: <K extends Key>({ key, defaultValue }: { key: K; defaultValue: KeyToType<K> }) =>
		Effect.gen(function* () {
			const valueFromStorage = yield* Effect.tryPromise({
				try: () => storage.get<unknown>(key),
				catch: (error) =>
					new GetExtensionStorageError({
						key,
						defaultValue,
						error,
					}),
			});
			const isEmpty = valueFromStorage === null || valueFromStorage === undefined;
			if (isEmpty) return defaultValue;
			const thisKeyValueSchema = S.asSchema(keyToSchema[key]);
			const parsedValue = yield* S.decodeUnknown(thisKeyValueSchema)(valueFromStorage);
			yield* Console.info('get', key, parsedValue);
			return parsedValue;
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends Key>({
		key,
		value,
	}: {
		key: K;
		value: KeyToType<K>;
	}): Effect.Effect<void, SetExtensionStorageError<K>> =>
		Effect.tryPromise({
			try: () => storage.set(key, value),
			catch: (error) => new SetExtensionStorageError({ key, value, error }),
		}),
	watch: <K extends Key>({
		key,
		callback,
	}: {
		key: K;
		callback: (newValue: KeyToType<K>) => void;
	}) => {
		const thisKeyValueSchema = S.asSchema(keyToSchema[key]);
		const listener: StorageWatchCallback = ({ newValue: newValueUnparsed }) =>
			Effect.gen(function* () {
				const newValue = yield* S.decodeUnknown(thisKeyValueSchema)(newValueUnparsed);
				yield* Console.info('watch', key, newValue);
				callback(newValue);
			}).pipe(Effect.runSync);
		return Effect.try({
			try: () => storage.watch({ [key]: listener }),
			catch: (error) => new WatchExtensionStorageError({ key, error }),
		});
	},
} as const;
