import { useStorage } from '@plasmohq/storage/hook';
import type { WhisperingStorageKey, WhisperingStorageKeyMap } from './keys';

export function useWhisperingStorage<T extends WhisperingStorageKey>(
	key: T,
	defaultValue: WhisperingStorageKeyMap[T],
) {
	const [value] = useStorage<WhisperingStorageKeyMap[T]>(key);
	return value ?? defaultValue;
}
