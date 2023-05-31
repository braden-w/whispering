import { writable } from 'svelte/store';

export const options = createOptionsStore();

type Options = {
	copyToClipboard: boolean;
	currentGlobalShortcut: string;
};

function createOptionsStore() {
	const initialOptions: Options = {
		copyToClipboard: true,
		currentGlobalShortcut: 'CommandOrControl+Shift+;'
	};
	const optionsFromStorage = getOptionsFromStorage();
	const { subscribe, set, update } = writable(optionsFromStorage || initialOptions);

	async function setOptions(options: Options) {
		setOptionsToStorage(options);
		set(options);
	}

	return {
		subscribe,
		set: setOptions,
		update
	};
}

function getOptionsFromStorage(): Options | undefined {
	const optionsFromStorage = localStorage.getItem('options');
	if (!optionsFromStorage) return;
	const parsedOptionsFromStorage = JSON.parse(optionsFromStorage);
	return parsedOptionsFromStorage;
}

function setOptionsToStorage(options: Options) {
	const stringifiedOptions = JSON.stringify(options);
	localStorage.setItem('options', stringifiedOptions);
}
