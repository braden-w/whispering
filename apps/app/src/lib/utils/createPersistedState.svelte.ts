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
