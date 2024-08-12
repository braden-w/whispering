import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { Schema as S } from '@effect/schema';
import { WhisperingError } from '@repo/shared';
import { Effect } from 'effect';

/**
 * Creates a persisted state object tied to local storage, accessible through `.value`
 */
export function createPersistedState<TSchema extends S.Schema.AnyNoContext>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false,
}: {
	/** The key used to store the value in local storage. */
	key: string;
	/**
	 * The schema is used to validate the value from local storage
	 * (`defaultValue` will be used if the value from local storage is invalid).
	 * */
	schema: TSchema;
	/**
	 * The default value to use if no value is found in local storage or the value
	 * from local storage fails to pass the schema.
	 * */
	defaultValue: S.Schema.Type<TSchema>;
	/**
	 * If true, disables the use of local storage. In SvelteKit, you set
	 * this to `!browser` because local storage doesn't exist in the server
	 * context.
	 *
	 * @example
	 *
	 * ```ts
	 * import { browser } from '$app/environment';
	 * ...
	 * const state = createPersistedState({ ..., disableLocalStorage: !browser })
	 * ...
	 * ```
	 * */
	disableLocalStorage?: boolean;
}) {
	let value = $state(defaultValue);

	const parseValueFromStorage = (valueFromStorage: string | null): S.Schema.Type<TSchema> => {
		const isEmpty = valueFromStorage === null;
		if (isEmpty) return defaultValue;
		const jsonSchema = S.parseJson(schema);
		const parseResult = S.decodeUnknown(jsonSchema)(valueFromStorage)
			.pipe(
				Effect.mapError(
					(e) =>
						new WhisperingError({
							variant: 'warning',
							title: `Invalid value from storage for key "${key}", using default value instead.`,
							description: e.message,
						}),
				),
				Effect.tapError(renderErrorAsToast),
				Effect.catchAll(() =>
					Effect.gen(function* () {
						// Attempt to merge the default value with the value from storage if possible
						const valueFromStorageParsed = yield* S.decodeUnknown(S.parseJson(S.Any))(
							valueFromStorage,
						);
						const defaultValueMaybeMergedOldValues = yield* S.decodeUnknown(schema)({
							...defaultValue,
							...valueFromStorageParsed,
						}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue)));

						localStorage.setItem(key, JSON.stringify(defaultValueMaybeMergedOldValues));
						return defaultValueMaybeMergedOldValues;
					}),
				),
			)
			.pipe(Effect.runSync);
		return parseResult as S.Schema.Type<TSchema>;
	};

	if (!disableLocalStorage) {
		value = parseValueFromStorage(localStorage.getItem(key));
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== key) return;
			value = parseValueFromStorage(event.newValue);
		});
		window.addEventListener('focus', () => {
			value = parseValueFromStorage(localStorage.getItem(key));
		});
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: S.Schema.Type<TSchema>) {
			value = newValue;
			if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(newValue));
		},
	};
}
