import { Storage } from '@plasmohq/storage/dist';
import { get, writable } from 'svelte/store';

export const isRecording = createisRecordingStore();

function createisRecordingStore() {
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

	async function setisRecording(value: boolean) {
		await storage.set('is-background-recording', value);
		set(value);
	}

	async function toggleisRecording() {
		const isRecording = get(isRecordingStore);
		await setisRecording(!isRecording);
	}

	return {
		init,
		subscribe,
		set: setisRecording,
		toggle: toggleisRecording,
		update
	};
}
