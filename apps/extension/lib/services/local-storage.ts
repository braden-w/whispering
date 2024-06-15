import { Schema as S } from '@effect/schema';
import { settingsSchema } from '@repo/shared';
import { Data, Effect } from 'effect';

const keyToSchema = {
	'whispering-settings': settingsSchema,
} as const;

type Keys = keyof typeof keyToSchema;

type KeyToType<K extends Keys> = S.Schema.Type<(typeof keyToSchema)[K]>;
export class GetLocalStorageError<K extends Keys> extends Data.TaggedError('GetLocalStorageError')<{
	key: K;
	defaultValue: KeyToType<K>;
	error: unknown;
}> {}

export class SetLocalStorageError<K extends Keys> extends Data.TaggedError('SetLocalStorageError')<{
	key: K;
	value: KeyToType<K>;
	error: unknown;
}> {}

export const localStorageService = {
	get: <K extends Keys>({
		key,
		defaultValue,
	}: {
		key: K;
		defaultValue: KeyToType<K>;
	}): Effect.Effect<KeyToType<K>> =>
		Effect.tryPromise({
			try: async () => {
				const valueFromStorage = localStorage.getItem(key);
				const isEmpty = valueFromStorage === null;
				if (isEmpty) return defaultValue;
				return keyToSchema[key].parse(JSON.parse(valueFromStorage));
			},
			catch: (error) =>
				new GetLocalStorageError({
					key,
					defaultValue,
					error,
				}),
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends Keys>({
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
