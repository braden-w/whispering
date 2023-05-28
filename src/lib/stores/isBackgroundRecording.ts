import { get, writable } from 'svelte/store';

import { Storage } from '@plasmohq/storage/dist';

export const isBackgroundRecording = createIsBackgroundRecordingStore();

function createIsBackgroundRecordingStore() {
	const storage = new Storage();

	const isBackgroundRecordingStore = writable(false);
	const { subscribe, set, update } = isBackgroundRecordingStore;
	storage.get<boolean | undefined>('is-background-recording').then((isRecording) => {
		set(!!isRecording);
	});

	async function setIsBackgroundRecording(value: boolean) {
		await storage.set('is-background-recording', value);
		set(value);
	}

	async function toggleIsBackgroundRecording() {
		const isRecording = get(isBackgroundRecording);
		await setIsBackgroundRecording(!isRecording);
	}

	return {
		subscribe,
		set: setIsBackgroundRecording,
		toggle: toggleIsBackgroundRecording,
		update
	};
}
