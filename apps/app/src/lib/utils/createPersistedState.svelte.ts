import { Schema as S } from '@effect/schema';
import { Option } from 'effect';

/**
 * Creates a persisted state tied to local storage.
 * @param {Object} params - The parameters for creating the persisted state.
 * @param {string} params.key - The key used to store the value in local storage.
 * @param {Schema} params.schema - The schema used to validate the value.
 * @param {S.Schema.Type<Schema>} params.defaultValue - The default value to use if no value is found in local storage.
 * @param {boolean} [params.disableLocalStorage=false] - If true, disables the use of local storage.
 * @returns {Object} The persisted state.
 * @returns {S.Schema.Type<Schema>} value - The reactive value of the persisted state.
 */
export function createPersistedState<TSchema extends S.Schema.AnyNoContext>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false,
}: {
	key: string;
	schema: TSchema;
	defaultValue: S.Schema.Type<TSchema>;
	disableLocalStorage?: boolean;
}) {
	let value = $state(defaultValue);

	const parseValueFromStorage = (valueFromStorage: string | null): S.Schema.Type<TSchema> => {
		const isEmpty = valueFromStorage === null;
		if (isEmpty) return defaultValue;
		const jsonSchema = S.parseJson(schema);
		return S.decodeUnknownOption(jsonSchema)(valueFromStorage).pipe(
			Option.getOrElse(() => defaultValue),
		);
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
