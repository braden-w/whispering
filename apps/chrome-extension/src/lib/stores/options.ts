import { createStoreSyncedWithStorage } from './createStore';

type Options = { copyToClipboard: boolean };
const initialOptions: Options = { copyToClipboard: true };
export const options = createStoreSyncedWithStorage<Options>({
	key: 'options',
	initialValue: initialOptions
});
