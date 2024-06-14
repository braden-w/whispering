import { goto } from '$app/navigation';
import { ClipboardService } from '$lib/services/ClipboardService';
import { ClipboardServiceDesktopLive } from '$lib/services/ClipboardServiceDesktopLive';
import { ClipboardServiceWebLive } from '$lib/services/ClipboardServiceWebLive';
import { RecordingsDbService, type Recording } from '$lib/services/RecordingDbService';
import { RecordingsDbServiceLiveIndexedDb } from '$lib/services/RecordingDbServiceIndexedDbLive.svelte';
import { ToastServiceLive } from '$lib/services/ToastServiceLive';
import { TranscriptionError, TranscriptionService } from '$lib/services/TranscriptionService';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperingLive';
import { renderErrorAsToast } from '$lib/services/errors';
import { ToastService } from '@repo/shared';
import { Effect, Either, Option } from 'effect';
import { recorderState } from './recorder.svelte';
import { settings } from './settings.svelte';

const createRecordings = Effect.gen(function* () {
	const { toast } = yield* ToastService;
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
		}).pipe(Effect.catchAll(renderErrorAsToast)),
		addRecording: (recording: Recording) =>
			Effect.gen(function* () {
				yield* recordingsDb.addRecording(recording);
				recordings.push(recording);
			}).pipe(Effect.catchAll(renderErrorAsToast)),
		updateRecording: (recording: Recording) =>
			Effect.gen(function* () {
				yield* updateRecording(recording);
				toast({
					variant: 'success',
					title: 'Recording updated!',
					description: 'Your recording has been updated successfully.',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast)),
		deleteRecordingById: (id: string) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingById(id);
				recordings = recordings.filter((recording) => recording.id !== id);
				toast({
					variant: 'success',
					title: 'Recording deleted!',
					description: 'Your recording has been deleted successfully.',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast)),
		deleteRecordingsById: (ids: string[]) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingsById(ids);
				recordings = recordings.filter((recording) => !ids.includes(recording.id));
				toast({
					variant: 'success',
					title: 'Recordings deleted!',
					description: 'Your recordings have been deleted successfully.',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast)),
		transcribeRecording: (id: string) => {
			const toastId = toast({
				variant: 'loading',
				title: 'Transcribing recording...',
				description: 'Your recording is being transcribed.',
			});
			if (recorderState.value !== 'RECORDING') {
				recorderState.value = 'LOADING';
			}
			return Effect.gen(function* () {
				const maybeRecording = yield* recordingsDb.getRecording(id);
				if (Option.isNone(maybeRecording)) {
					return yield* new TranscriptionError({
						title: `Recording with id ${id} not found`,
						description: 'Please try again.',
					});
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
				toast({
					variant: 'success',
					id: toastId,
					title: 'Transcription complete!',
					description: 'Check it out in your recordings',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
				return transcribedText;
			}).pipe(
				Effect.catchAll((error) => renderErrorAsToast(error, { toastId })),
				Effect.map((transcribedText) =>
					Effect.gen(function* () {
						if (transcribedText === '') return;

						if (settings.isCopyToClipboardEnabled) {
							// Copy transcription to clipboard if enabled
							yield* clipboardService.setClipboardText(transcribedText);
							toast({
								variant: 'success',
								title: 'Copied transcription to clipboard!',
								description: transcribedText,
								descriptionClass: 'line-clamp-2',
							});
						}

						// Paste transcription if enabled
						if (settings.isPasteContentsOnSuccessEnabled) {
							yield* clipboardService.writeText(transcribedText);
							toast({
								variant: 'success',
								title: 'Pasted transcription!',
								description: transcribedText,
								descriptionClass: 'line-clamp-2',
							});
						}
					}),
				),
				Effect.catchAll(renderErrorAsToast),
				Effect.runPromise,
			);
		},
		copyRecordingText: (recording: Recording) =>
			Effect.gen(function* () {
				if (recording.transcribedText === '') return;
				yield* clipboardService.setClipboardText(recording.transcribedText);
				toast({
					variant: 'success',
					title: 'Copied transcription to clipboard!',
					description: recording.transcribedText,
					descriptionClass: 'line-clamp-2',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
	};
});

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceWhisperLive),
	Effect.provide(ToastServiceLive),
	Effect.provide(window.__TAURI__ ? ClipboardServiceDesktopLive : ClipboardServiceWebLive),
	Effect.runSync,
);

recordings.sync.pipe(Effect.runPromise);
