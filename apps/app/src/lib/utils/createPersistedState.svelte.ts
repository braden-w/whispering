import { toast } from '$lib/services/ToastService';
import { Schema as S } from '@effect/schema';
import { Effect, Either } from 'effect';

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
		const parseResult = S.decodeUnknownEither(jsonSchema)(valueFromStorage);
		if (Either.isLeft(parseResult)) {
			toast({
				title: 'Unable to parse storage value',
				description: parseResult.left.message,
				variant: 'warning',
			}).pipe(Effect.runSync);
			return defaultValue;
		}
		return Either.right(parseResult) as S.Schema.Type<TSchema>;
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
