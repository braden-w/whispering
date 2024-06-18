import { Schema as S } from '@effect/schema';

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
export function createPersistedState<A, I>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false,
}: {
	key: string;
	schema: S.Schema<A, I>;
	defaultValue: A;
	disableLocalStorage?: boolean;
}) {
	let value = $state(defaultValue);

	if (!disableLocalStorage) {
		value = loadFromStorage({ key, schema, defaultValue });
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== key) return;
			try {
				const isStorageEmpty = event.newValue === null;
				if (isStorageEmpty) {
					value = defaultValue;
					return;
				}
				const jsonSchema = S.parseJson(schema);
				const validValue = S.decodeUnknownSync(jsonSchema)(event.newValue);
				value = validValue;
			} catch {
				value = defaultValue;
			}
		});
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: A) {
			value = newValue;
			if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(newValue));
		},
	};
}

function loadFromStorage<A, I>({
	key,
	schema,
	defaultValue,
}: {
	key: string;
	schema: S.Schema<A, I>;
	defaultValue: A;
}): A {
	try {
		const valueFromStorageStringified = localStorage.getItem(key);
		const isEmpty = valueFromStorageStringified === null;
		if (isEmpty) return defaultValue;
		const jsonSchema = S.parseJson(schema);
		return S.decodeUnknownSync(jsonSchema)(valueFromStorageStringified);
	} catch {
		return defaultValue;
	}
}
