import { goto } from '$app/navigation';
import { ClipboardService } from '$lib/services/ClipboardService';
import { ClipboardServiceDesktopLive } from '$lib/services/ClipboardServiceDesktopLive';
import { ClipboardServiceWebLive } from '$lib/services/ClipboardServiceWebLive';
import { RecordingsDbService, type Recording } from '$lib/services/RecordingDbService';
import { RecordingsDbServiceLiveIndexedDb } from '$lib/services/RecordingDbServiceIndexedDbLive.svelte';
import { TranscriptionError, TranscriptionService } from '$lib/services/TranscriptionService';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperingLive';
import { catchErrorsAsToast } from '$lib/services/errors';
import { Effect, Either, Option } from 'effect';
import { toast } from 'svelte-sonner';
import { settings } from './settings.svelte';

const createRecordings = Effect.gen(function* () {
	const recordingsDb = yield* RecordingsDbService;
	const transcriptionService = yield* TranscriptionService;
	const clipboardService = yield* ClipboardService;

	let recordings = $state<Recording[]>([]);
	const updateRecording = (recording: Recording) =>
		Effect.gen(function* () {
			yield* recordingsDb.updateRecording(recording);
			recordings = recordings.map((r) => (r.id === recording.id ? recording : r));
		});
	return {
		get value() {
			return recordings;
		},
		sync: Effect.gen(function* () {
			recordings = yield* recordingsDb.getAllRecordings;
		}).pipe(catchErrorsAsToast),
		addRecording: (recording: Recording) =>
			Effect.gen(function* () {
				yield* recordingsDb.addRecording(recording);
				recordings.push(recording);
			}).pipe(catchErrorsAsToast),
		updateRecording: (recording: Recording) =>
			Effect.gen(function* () {
				yield* updateRecording(recording);
				toast.success('Recording updated!');
			}).pipe(catchErrorsAsToast),
		deleteRecordingById: (id: string) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingById(id);
				recordings = recordings.filter((recording) => recording.id !== id);
				toast.success('Recording deleted!');
			}).pipe(catchErrorsAsToast),
		deleteRecordingsById: (ids: string[]) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingsById(ids);
				recordings = recordings.filter((recording) => !ids.includes(recording.id));
				toast.success('Recordings deleted!');
			}).pipe(catchErrorsAsToast),
		transcribeRecording: (id: string) => {
			const toastId = toast.loading('Transcribing recording...');
			return Effect.gen(function* () {
				const maybeRecording = yield* recordingsDb.getRecording(id);
				if (Option.isNone(maybeRecording)) {
					return yield* new TranscriptionError({ title: `Recording with id ${id} not found` });
				}
				const recording = maybeRecording.value;
				yield* updateRecording({ ...recording, transcriptionStatus: 'TRANSCRIBING' });
				const transcriptionResult = yield* Effect.either(
					transcriptionService.transcribe(recording.blob, settings),
				);
				if (Either.isLeft(transcriptionResult)) {
					yield* updateRecording({ ...recording, transcriptionStatus: 'UNPROCESSED' });
					const error = transcriptionResult.left;
					return yield* error;
				}
				const transcribedText = transcriptionResult.right;
				yield* updateRecording({ ...recording, transcribedText, transcriptionStatus: 'DONE' });
				if (settings.isCopyToClipboardEnabled && transcribedText)
					yield* clipboardService.setClipboardText(transcribedText);
				if (settings.isPasteContentsOnSuccessEnabled && transcribedText)
					yield* clipboardService.writeText(transcribedText);
				toast.success('Transcription complete!', {
					id: toastId,
					description: 'Check it out in your recordings',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			}).pipe((program) => catchErrorsAsToast(program, { toastId }), Effect.runPromise);
		},
		copyRecordingText: (recording: Recording) =>
			Effect.gen(function* () {
				if (recording.transcribedText === '') return;
				yield* clipboardService.setClipboardText(recording.transcribedText);
				toast.success('Copied to clipboard!');
			}).pipe(catchErrorsAsToast, Effect.runPromise),
	};
});

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceWhisperLive),
	Effect.provide(window.__TAURI__ ? ClipboardServiceDesktopLive : ClipboardServiceWebLive),
	Effect.runSync,
);

recordings.sync.pipe(Effect.runPromise);
