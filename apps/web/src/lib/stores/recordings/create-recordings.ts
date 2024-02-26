import { RecordingsDbService, type Recording } from '@repo/recorder/services/recordings-db';
import { TranscriptionService } from '@repo/recorder/services/transcription';
import { Data, Effect } from 'effect';
import { get, writable } from 'svelte/store';
import { apiKey } from '../apiKey';

class TranscriptionRecordingNotFoundError extends Data.TaggedError('RecordingNotFound')<{
	id: string;
	message: string;
}> {}

export const createRecordings = Effect.gen(function* (_) {
	const recordingsDb = yield* _(RecordingsDbService);
	const transcriptionService = yield* _(TranscriptionService);
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
				if (!recording) {
					return yield* _(
						new TranscriptionRecordingNotFoundError({
							id,
							message: `Recording with id ${id} not found`
						})
					);
				}
				yield* _(editRecording({ ...recording, state: 'TRANSCRIBING' }));
				const transcribedText = yield* _(
					transcriptionService.transcribe(recording.blob, { apiKey: get(apiKey) })
				);
				yield* _(editRecording({ ...recording, transcribedText, state: 'DONE' }));
			})
	};
});
