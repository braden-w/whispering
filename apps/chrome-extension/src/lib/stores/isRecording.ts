import { Storage } from '@plasmohq/storage/dist';
import { get, writable } from 'svelte/store';

export const isRecording = createIsRecordingStore();

function createIsRecordingStore() {
	const initialIsRecording = false;
	const isRecordingStore = writable(initialIsRecording);
	const { subscribe, set, update } = isRecordingStore;
	const storage = new Storage();

	async function init() {
		const isRecordingFromStorage = await storage.get<boolean | undefined>(
			'is-background-recording'
		);
		set(!!isRecordingFromStorage || initialIsRecording);
	}

	async function setIsRecording(value: boolean) {
		await storage.set('is-background-recording', value);
		set(value);
	}

	async function toggleIsRecording() {
		const isRecording = get(isRecordingStore);
		await setIsRecording(!isRecording);
	}

	return {
		init,
		subscribe,
		set: setIsRecording,
		toggle: toggleIsRecording,
		update
	};
}
