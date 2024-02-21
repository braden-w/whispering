import { writable } from 'svelte/store';

type RecordingState = 'IDLE' | 'RECORDING' | 'TRANSCRIBING';

function createRecorder(
	{
		initial = 'IDLE'
	}: {
		initial?: RecordingState;
	} = {
		initial: 'IDLE'
	}
) {
	const { subscribe, set, update } = writable<RecordingState>(initial);
	return {
		subscribe,
		set,
		update
	};
}

export const recordingState = createRecorder();
export const outputText = writable('');
export const audioSrc = writable('');
