import { Schema as S } from '@effect/schema';
import { settingsSchema } from '@repo/shared';
import { Data, Effect } from 'effect';

const keys = ['whispering-settings'] as const;

type Key = (typeof keys)[number];

const keyToSchema = {
	'whispering-settings': settingsSchema,
} as const;

type KeyToType<K extends Key> = S.Schema.Type<(typeof keyToSchema)[K]>;
export class GetLocalStorageError<K extends Key> extends Data.TaggedError('GetLocalStorageError')<{
	key: K;
	defaultValue: KeyToType<K>;
	error: unknown;
}> {}

export class SetLocalStorageError<K extends Key> extends Data.TaggedError('SetLocalStorageError')<{
	key: K;
	value: KeyToType<K>;
	error: unknown;
}> {}

export const localStorageService = {
	get: <K extends Key>({ key, defaultValue }: { key: K; defaultValue: KeyToType<K> }) =>
		Effect.gen(function* () {
			const valueFromStorage = yield* Effect.try({
				try: () => localStorage.getItem(key),
				catch: (error) =>
					new GetLocalStorageError({
						key,
						defaultValue,
						error,
					}),
			});
			const isEmpty = valueFromStorage === null || valueFromStorage === undefined;
			if (isEmpty) return defaultValue;
			const thisKeyValueSchema = S.parseJson(S.asSchema(keyToSchema[key]));
			const parsedValue = yield* S.decodeUnknown(thisKeyValueSchema)(valueFromStorage);
			return parsedValue;
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends Key>({
		key,
		value,
	}: {
		key: K;
		value: KeyToType<K>;
	}): Effect.Effect<void, SetLocalStorageError<K>> =>
		Effect.try({
			try: () => localStorage.setItem(key, JSON.stringify(value)),
			catch: (error) => new SetLocalStorageError({ key, value, error }),
		}),
} as const;
