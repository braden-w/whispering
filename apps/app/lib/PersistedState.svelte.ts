import type { z } from 'zod';

/**
 * An extension of Svelte's `writable` that also saves its state to localStorage and
 * automatically restores it.
 * @param key The localStorage key to use for saving the writable's contents.
 * @param schema A Zod schema describing the contents of the writable.
 * @param defaultValue The initial value to use if no prior state has been saved in
 * localstorage.
 * @param disableLocalStorage Skip interaction with localStorage, for example during SSR.
 * @returns A stored writable.
 */

export function PersistedState<TValue extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
	disableLocalStorage = false
}: {
	key: string;
	schema: TValue;
	defaultValue: z.infer<TValue>;
	disableLocalStorage?: boolean;
}) {
	let value = $state(defaultValue);

	if (!disableLocalStorage) {
		value = loadFromStorage({ key, schema, defaultValue });
		createStorageEventListener({ key, schema, bindedValue: value, defaultValue });
	}

	return {
		get value() {
			return value;
		},
		set value(newValue: TValue) {
			value = newValue;
			if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(newValue));
		}
	};
}

function loadFromStorage<T extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue
}: {
	key: string;
	schema: T;
	defaultValue: z.infer<T>;
}) {
	try {
		const item = localStorage.getItem(key);
		if (item === null) return defaultValue;
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
	bindedValue,
	defaultValue
}: {
	key: string;
	schema: T;
	bindedValue: z.infer<T>;
	defaultValue: z.infer<T>;
}) {
	window.addEventListener('storage', (event: StorageEvent) => {
		if (event.key === key) {
			try {
				const newValue = event.newValue ? JSON.parse(event.newValue) : defaultValue;
				const validValue = schema.parse(newValue);
				bindedValue = validValue;
			} catch {
				bindedValue = defaultValue;
			}
		}
	});
}
