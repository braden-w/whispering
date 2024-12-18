import { useStorage } from '@plasmohq/storage/hook';
import type {
	WhisperingStorageKey,
	WhisperingStorageKeyToStorageValue,
} from './keys';

export function useWhisperingStorage<T extends WhisperingStorageKey>(
	key: T,
	defaultValue: WhisperingStorageKeyToStorageValue[T],
) {
	const [value] = useStorage<WhisperingStorageKeyToStorageValue[T]>(key);
	return value ?? defaultValue;
}
