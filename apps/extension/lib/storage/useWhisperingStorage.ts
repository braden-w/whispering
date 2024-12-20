import { Storage } from '@plasmohq/storage';
import { useStorage } from '@plasmohq/storage/hook';
import type { WhisperingStorageKey, WhisperingStorageKeyMap } from './keys';

function useWhisperingStorage<T extends WhisperingStorageKey>(
	key: T,
	defaultValue: WhisperingStorageKeyMap[T],
) {
	const [value] = useStorage<WhisperingStorageKeyMap[T]>({
		key,
		instance: new Storage({ area: 'session' }),
	});
	return value ?? defaultValue;
}

export function useWhisperingRecorderState() {
	return useWhisperingStorage('whispering-recorder-state', 'IDLE');
}

export function useWhisperingTranscribedText() {
	return useWhisperingStorage(
		'whispering-latest-recording-transcribed-text',
		'',
	);
}
