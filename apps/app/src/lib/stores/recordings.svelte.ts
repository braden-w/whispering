import { goto } from '$app/navigation';
import { ClipboardService } from '$lib/services/ClipboardService';
import { ClipboardServiceDesktopLive } from '$lib/services/ClipboardServiceDesktopLive';
import { ClipboardServiceWebLive } from '$lib/services/ClipboardServiceWebLive';
import { RecordingsDbService, type Recording } from '$lib/services/RecordingDbService';
import { RecordingsDbServiceLiveIndexedDb } from '$lib/services/RecordingDbServiceIndexedDbLive.svelte';
import { TranscriptionError, TranscriptionService } from '$lib/services/TranscriptionService';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperingLive';
import { catchErrorsAsToast } from '$lib/services/errors';
import { Effect, Either, Option, pipe } from 'effect';
import { toast } from 'svelte-sonner';
import { settings } from './settings.svelte';
import { recorderState } from './recorder.svelte';
import { sendMessageToExtension } from '$lib/messaging';

const MAX_LENGTH_TRANSCRIBED_TEXT_IN_TOAST = 92;

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
			if (recorderState.value !== 'RECORDING') {
				recorderState.value = 'LOADING';
			}
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
				if (recorderState.value !== 'RECORDING') {
					recorderState.value = 'IDLE';
				}
				toast.success('Transcription complete!', {
					id: toastId,
					description: 'Check it out in your recordings',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
				return transcribedText;
			}).pipe(
				(program) => catchErrorsAsToast(program, { toastId }),
				Effect.andThen((transcribedText) =>
					Effect.gen(function* () {
						if (transcribedText === '') return;

						if (settings.isCopyToClipboardEnabled) {
							// Copy transcription to clipboard if enabled
							yield* clipboardService.setClipboardText(transcribedText).pipe(
								Effect.catchAll((error) =>
									sendMessageToExtension({
										message: 'transcription',
										transcription: transcribedText,
									}),
								),
								Effect.andThen(() => {
									toast.success('Copied transcription to clipboard!', {
										description: transcribedText,
										descriptionClass: 'line-clamp-2',
									});
								}),
							);
						}

						// Paste transcription if enabled
						if (settings.isPasteContentsOnSuccessEnabled) {
							yield* clipboardService.writeText(transcribedText).pipe(
								Effect.andThen(() => {
									toast.success('Pasted transcription!', {
										description: transcribedText,
										descriptionClass: 'line-clamp-2',
									});
								}),
							);
						}
					}),
				),
				catchErrorsAsToast,
				Effect.runPromise,
			);
		},
		copyRecordingText: (recording: Recording) =>
			Effect.gen(function* () {
				if (recording.transcribedText === '') return;
				yield* clipboardService.setClipboardText(recording.transcribedText);
				toast.success('Copied transcription to clipboard!', {
					description: recording.transcribedText,
					descriptionClass: 'line-clamp-2',
				});
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
