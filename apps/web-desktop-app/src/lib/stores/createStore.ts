import { writable } from 'svelte/store';

export function createStoreSyncedWithStorage<T>({
	key,
	initialValue
}: {
	key: string;
	initialValue: T;
}) {
	const valueFromStorage = getValueFromStorage<T>({ key, defaultValue: initialValue });
	const { subscribe, set, update } = writable<T>(valueFromStorage || initialValue);

	function setValue(value: T) {
		setValueToStorage(key, value);
		set(value);
	}

	return {
		subscribe,
		set: setValue,
		update
	};
}

function getValueFromStorage<T>({
	key,
	defaultValue
}: {
	key: string;
	defaultValue: T;
}): T | undefined {
	const optionsFromStorage = localStorage.getItem(key);
	if (!optionsFromStorage) return;
	try {
		const parsedOptionsFromStorage = JSON.parse(optionsFromStorage);
		return parsedOptionsFromStorage as T;
	} catch (error) {
		console.error('Error parsing JSON:', error);
		return defaultValue;
	}
}

function setValueToStorage<T>(key: string, value: T) {
	const stringifiedOptions = JSON.stringify(value);
	localStorage.setItem(key, stringifiedOptions);
}
