import type {
	AddRecordingError,
	DeleteRecordingError,
	EditRecordingError,
	GetAllRecordingsError,
	GetRecordingError
} from '@repo/recorder';
import { RecordingsDbService, type Recording } from '@repo/recorder';
import type { TranscriptionError } from '@repo/recorder/services/transcription';
import { TranscriptionService } from '@repo/recorder/services/transcription';
import { Context, Data, Effect } from 'effect';
import { writable, type Readable } from 'svelte/store';

export class RecordingsStateService extends Context.Tag('RecordingsStateService')<
	RecordingsStateService,
	{
		readonly subscribe: Readable<Recording[]>['subscribe'];
		readonly sync: Effect.Effect<void, GetAllRecordingsError>;
		readonly addRecording: (recording: Recording) => Effect.Effect<void, AddRecordingError>;
		readonly editRecording: (recording: Recording) => Effect.Effect<void, EditRecordingError>;
		readonly deleteRecording: (id: string) => Effect.Effect<void, DeleteRecordingError>;
		readonly transcribeRecording: (
			id: string
		) => Effect.Effect<
			void,
			| EditRecordingError
			| GetRecordingError
			| TranscriptionRecordingNotFoundError
			| TranscriptionError,
			TranscriptionService
		>;
	}
>() {}

export const createRecordings = Effect.gen(function* (_) {
	const recordingsDb = yield* _(RecordingsDbService);
	const { subscribe, set, update } = writable<Recording[]>([]);
	const editRecording = (recording: Recording) =>
		Effect.gen(function* (_) {
			yield* _(recordingsDb.editRecording(recording));
			update((recordings) => {
				const index = recordings.findIndex((r) => r.id === recording.id);
				if (index === -1) return recordings;
				recordings[index] = recording;
				return recordings;
			});
		});
	return {
		subscribe,
		sync: Effect.gen(function* (_) {
			const recordings = yield* _(recordingsDb.getAllRecordings);
			set(recordings);
		}),
		addRecording: (recording: Recording) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.addRecording(recording));
				update((recordings) => [...recordings, recording]);
				console.log('🚀 ~ addRecording ~ recording:', recording);
			}),
		editRecording,
		deleteRecording: (id: string) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.deleteRecording(id));
				update((recordings) => recordings.filter((recording) => recording.id !== id));
			}),
		transcribeRecording: (id: string) =>
			Effect.gen(function* (_) {
				const recording = yield* _(recordingsDb.getRecording(id));
				if (!recording) return yield* _(new TranscriptionRecordingNotFoundError({ id }));
				yield* _(editRecording({ ...recording, state: 'TRANSCRIBING' }));
				const transcriptionService = yield* _(TranscriptionService);
				const transcription = yield* _(transcriptionService.transcribe(recording.blob));
				yield* _(editRecording({ ...recording, state: 'DONE' }));
				yield* _(editRecording({ ...recording, transcription }));
			})
	} satisfies Context.Tag.Service<RecordingsStateService>;
});

class TranscriptionRecordingNotFoundError extends Data.TaggedError('RecordingNotFound')<{
	id: string;
}> {}
