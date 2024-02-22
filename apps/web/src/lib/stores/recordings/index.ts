import type { Recording } from '@repo/recorder';
import { writable } from 'svelte/store';

export function createRecordings() {
	const { subscribe, update } = writable<Recording[]>([]);
	return {
		subscribe,
		addRecording: (recording: Recording) => {
			update((recordings) => [...recordings, recording]);
		},
		deleteRecording: (id: string) => {
			update((recordings) => recordings.filter((recording) => recording.id !== id));
		},
		setRecording: (id: string, recording: Recording) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index] = recording;
				return recordings;
			});
		},
		setRecordingState: (id: string, state: RecordingState) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index].state = state;
				return recordings;
			});
		},
		setRecordingTranscription: (id: string, transcription: string) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index].transcription = transcription;
				return recordings;
			});
		}
	};
}
