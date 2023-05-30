import { get, writable } from 'svelte/store';

export const isRecording = createisRecordingStore();

function createisRecordingStore() {
	const isRecordingStore = writable(false);
	const { subscribe, set, update } = isRecordingStore;

	async function toggleisRecording() {
		const isRecording = get(isRecordingStore);
		await set(!isRecording);
	}

	return {
		subscribe,
		set,
		toggle: toggleisRecording,
		update
	};
}

export const outputText = writable('');
export const audioSrc = writable('');
