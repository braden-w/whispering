import type {
	WhisperingStorageKey,
	WhisperingStorageKeyToStorageValue,
} from './keys';

const createWhisperingStorage = () => {
	const storage = new Storage();

	return {
		setItem: <K extends WhisperingStorageKey>(
			key: K,
			value: WhisperingStorageKeyToStorageValue[K],
		) => {
			storage.setItem(key, JSON.stringify(value));
		},
	};
};

export const whisperingStorage = createWhisperingStorage();
