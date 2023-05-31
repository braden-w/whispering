import { get, writable } from 'svelte/store';

export const isRecording = createIsRecordingStore();

function createIsRecordingStore() {
	const isRecordingStore = writable(false);
	const { subscribe, set, update } = isRecordingStore;

	async function toggleIsRecording() {
		const isRecording = get(isRecordingStore);
		await set(!isRecording);
	}

	return {
		subscribe,
		set,
		toggle: toggleIsRecording,
		update
	};
}

export const outputText = writable('');
export const audioSrc = writable('');
