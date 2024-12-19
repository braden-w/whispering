import { Storage } from '@plasmohq/storage';
import type { WhisperingStorageKey, WhisperingStorageKeyMap } from './keys';

const createWhisperingStorage = () => {
	const storage = new Storage({ area: 'session' });
	return {
		setItem: <K extends WhisperingStorageKey>(
			key: K,
			value: WhisperingStorageKeyMap[K],
		) => {
			storage.setItem(key, JSON.stringify(value));
		},
	};
};

export const whisperingStorage = createWhisperingStorage();
