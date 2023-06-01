import { createStoreSyncedWithStorage } from './createStore';

type Options = {
	copyToClipboard: boolean;
	currentGlobalShortcut: string;
};

const initialOptions: Options = {
	copyToClipboard: true,
	currentGlobalShortcut: 'CommandOrControl+Shift+;'
};

export const options = createStoreSyncedWithStorage<Options>({
	key: 'options',
	initialValue: initialOptions
});
