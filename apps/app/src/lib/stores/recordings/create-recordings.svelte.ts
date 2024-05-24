import { ClipboardService } from '@repo/services/services/clipboard';
import { RecordingsDbService, type Recording } from '@repo/services/services/recordings-db';
import { TranscriptionError, TranscriptionService } from '@repo/services/services/transcription';
import { Effect } from 'effect';
import { toast } from 'svelte-sonner';
import { settings } from '../settings.svelte';

class TranscriptionRecordingNotFoundError extends TranscriptionError {
	constructor({ message }: { message: string }) {
		super({ message });
	}
}

export const createRecordings = Effect.gen(function* (_) {
	const recordingsDb = yield* _(RecordingsDbService);
	const transcriptionService = yield* _(TranscriptionService);
	const clipboardService = yield* _(ClipboardService);

	let recordings = $state<Recording[]>([]);
	const setRecording = (recording: Recording) =>
		Effect.gen(function* (_) {
			yield* _(recordingsDb.updateRecording(recording));
			recordings = recordings.map((r) => (r.id === recording.id ? recording : r));
		});
	return {
		get value() {
			return recordings;
		},
		sync: Effect.gen(function* (_) {
			recordings = yield* _(recordingsDb.getAllRecordings);
		}).pipe(
			Effect.catchAll((error) => {
				console.error(error);
				toast.error(error.message);
				return Effect.succeed(undefined);
			})
		),
		addRecording: (recording: Recording) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.addRecording(recording));
				recordings.push(recording);
			}).pipe(
				Effect.catchAll((error) => {
					console.error(error);
					toast.error(error.message);
					return Effect.succeed(undefined);
				})
			),
		editRecording: (recording: Recording) =>
			Effect.gen(function* (_) {
				yield* _(setRecording(recording));
				toast.success('Recording updated!');
			}).pipe(
				Effect.catchAll((error) => {
					console.error(error);
					toast.error(error.message);
					return Effect.succeed(undefined);
				})
			),
		deleteRecording: (id: string) =>
			Effect.gen(function* (_) {
				yield* _(recordingsDb.deleteRecording(id));
				recordings = recordings.filter((recording) => recording.id !== id);
				toast.success('Recording deleted!');
			}).pipe(
				Effect.catchAll((error) => {
					console.error(error);
					toast.error(error.message);
					return Effect.succeed(undefined);
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
				yield* _(setRecording({ ...recording, transcriptionStatus: 'TRANSCRIBING' }));
				const transcribedText = yield* _(transcriptionService.transcribe(recording.blob, settings));
				yield* _(setRecording({ ...recording, transcribedText, transcriptionStatus: 'DONE' }));
				return transcribedText;
			}),
		copyRecordingText: (recording: Recording) =>
			Effect.gen(function* (_) {
				if (!recording.transcribedText) return;
				yield* _(clipboardService.setClipboardText(recording.transcribedText));
				toast.success('Copied to clipboard!');
			})
	};
});
