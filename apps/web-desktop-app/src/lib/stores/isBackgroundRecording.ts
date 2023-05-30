import { get, writable } from 'svelte/store';

export const isBackgroundRecording = createIsBackgroundRecordingStore();

function createIsBackgroundRecordingStore() {
	const isBackgroundRecordingStore = writable(false);
	const { subscribe, set, update } = isBackgroundRecordingStore;

	async function toggleIsBackgroundRecording() {
		const isRecording = get(isBackgroundRecording);
		await set(!isRecording);
	}

	return {
		subscribe,
		set,
		toggle: toggleIsBackgroundRecording,
		update
	};
}

export const outputText = writable('');
export const audioSrc = writable('');