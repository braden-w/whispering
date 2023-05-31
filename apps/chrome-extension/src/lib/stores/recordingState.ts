import { Storage } from '@plasmohq/storage/dist';
import { writable } from 'svelte/store';

export const recordingState = createRecordingStateStore();

type RecordingState = 'idle' | 'recording' | 'transcribing';
function createRecordingStateStore() {
	const initialRecordingState: RecordingState = 'idle';
	const recordingStateStore = writable<RecordingState>(initialRecordingState);
	const { subscribe, set, update } = recordingStateStore;
	const storage = new Storage();

	async function init() {
		const recordingStateFromStorage = await storage.get<RecordingState>('recording-state');
		set(recordingStateFromStorage || initialRecordingState);
	}

	async function setRecordingState(value: RecordingState) {
		await storage.set('recording-state', value);
		set(value);
	}

	return {
		init,
		subscribe,
		set: setRecordingState,
		update
	};
}
