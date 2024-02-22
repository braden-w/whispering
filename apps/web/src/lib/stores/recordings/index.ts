import { RecordingsDb, type Recording } from '@repo/recorder';
import { Effect } from 'effect';
import { writable, type Writable } from 'svelte/store';

// readonly getAllRecordings: Effect.Effect<Recording[], GetAllRecordingsError>;
// readonly getRecording: (id: string) => Effect.Effect<Recording | undefined, GetRecordingError>;
// readonly addRecording: (recording: Recording) => Effect.Effect<void, AddRecordingError>;
// readonly editRecording: (
// 	id: string,
// 	recording: Recording
// ) => Effect.Effect<void, EditRecordingError>;
// readonly deleteRecording: (id: string) => Effect.Effect<void, DeleteRecordingError>;

export function createRecordings() {
	const { subscribe, set, update } = writable<Recording[]>([]);
	return {
		subscribe,
		sync: Effect.gen(function* (_) {
			const recordingsDb = yield* _(RecordingsDb);
			const recordings = yield* _(recordingsDb.getAllRecordings);
			set(recordings);
		}),
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
