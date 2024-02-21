import { createStoreSyncedWithStorage } from './createStore';

type Options = {
	copyToClipboard: boolean;
	pasteContentsOnSuccess: boolean;
	currentGlobalShortcut: string;
};

const initialOptions: Options = {
	copyToClipboard: true,
	pasteContentsOnSuccess: false,
	currentGlobalShortcut: 'CommandOrControl+Shift+;'
};

export const options = createStoreSyncedWithStorage<Options>({
	key: 'options',
	initialValue: initialOptions
});
