import { RecordingsDbService, type Recording } from '@repo/recorder/services/recordings-db';
import { TranscriptionError, TranscriptionService } from '@repo/recorder/services/transcription';
import { toast } from '@repo/ui/components/sonner';
import { Effect } from 'effect';
import { get, writable } from 'svelte/store';
import { settings } from '../settings';
import PleaseEnterAPIKeyToast from '$lib/toasts/PleaseEnterAPIKeyToast.svelte';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';

class TranscriptionRecordingNotFoundError extends TranscriptionError {
	constructor({ message }: { message: string }) {
		super({ message });
	}
}

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
		}).pipe(
			Effect.catchAll((error) => {
				toast.error(error.message);
				return Effect.succeed(error);
			})
		),
		addRecording: (recording: Recording) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.addRecording(recording));
				update((recordings) => [...recordings, recording]);
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(error);
				})
			),
		editRecording,
		deleteRecording: (id: string) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.deleteRecording(id));
				update((recordings) => recordings.filter((recording) => recording.id !== id));
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(error);
				})
			),
		transcribeRecording: (id: string) =>
			Effect.gen(function* (_) {
				const recording = yield* _(recordingsDb.getRecording(id));
				if (!recording) {
					return yield* _(
						new TranscriptionRecordingNotFoundError({
							message: `Recording with id ${id} not found`
						})
					);
				}
				yield* _(editRecording({ ...recording, transcriptionStatus: 'TRANSCRIBING' }));
				const transcribedText = yield* _(
					transcriptionService.transcribe(recording.blob, { apiKey: get(settings).apiKey })
				);
				yield* _(editRecording({ ...recording, transcribedText, transcriptionStatus: 'DONE' }));
			}).pipe(
				Effect.catchTags({
					PleaseEnterApiKeyError: () => {
						toast.error(PleaseEnterAPIKeyToast);
						return Effect.succeed(undefined);
					}
				}),
				Effect.catchAll(() => {
					toast.error(SomethingWentWrongToast);
					return Effect.succeed(undefined);
				})
			)
	};
});
