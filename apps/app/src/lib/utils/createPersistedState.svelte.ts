import type { z } from 'zod';

/**
 * Creates a persisted state tied to local storage.
 * @param {Object} params - The parameters for creating the persisted state.
 * @param {string} params.key - The key used to store the value in local storage.
 * @param {TSchema} params.schema - The Zod schema used to validate the value.
 * @param {z.infer<TSchema>} params.defaultValue - The default value to use if no value is found in local storage.
 * @param {boolean} [params.disableLocalStorage=false] - If true, disables the use of local storage.
 * @returns {Object} The persisted state.
 * @returns {z.infer<TSchema>} value - The reactive value of the persisted state.
 */
export function createPersistedState<TSchema extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false,
}: {
	key: string;
	schema: TSchema;
	defaultValue: z.infer<TSchema>;
	disableLocalStorage?: boolean;
}) {
	let value = $state(defaultValue);

	if (!disableLocalStorage) {
		value = loadValueFromStorage({ key, schema, defaultValue });
		createStorageEventListener({
			key,
			schema,
			setValue: (newValue) => (value = newValue),
			defaultValue,
		});
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: z.infer<TSchema>) {
			value = newValue;
			if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(newValue));
		},
	};
}

function loadValueFromStorage<T extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
}: {
	key: string;
	schema: T;
	defaultValue: z.infer<T>;
}): z.infer<T> {
	try {
		const item = localStorage.getItem(key);
		const isStorageEmpty = item === null;
		if (isStorageEmpty) return defaultValue;
		return schema.parse(JSON.parse(item));
	} catch {
		return defaultValue;
	}
}

function removeFromStorage(key: string) {
	localStorage.removeItem(key);
}

function createStorageEventListener<T extends z.ZodTypeAny>({
	key,
	schema,
	setValue,
	defaultValue,
}: {
	key: string;
	schema: T;
	setValue: (newValue: z.infer<T>) => void;
	defaultValue: z.infer<T>;
}) {
	window.addEventListener('storage', (event: StorageEvent) => {
		if (event.key === key) {
			try {
				const isStorageEmpty = event.newValue === null;
				if (isStorageEmpty) {
					setValue(null);
					return;
				}
				const validValue = schema.parse(JSON.parse(event.newValue));
				setValue(validValue);
			} catch {
				setValue(defaultValue);
			}
		}
	});
}
