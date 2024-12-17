import { goto } from '$app/navigation';
import { MainLive } from '$lib/services';
import { ClipboardService } from '$lib/services/ClipboardService';
import { DownloadService } from '$lib/services/DownloadService';
import {
	type Recording,
	RecordingsDbService,
} from '$lib/services/RecordingDbService';
import { toast } from '$lib/services/ToastService';
import { TranscriptionServiceFasterWhisperServerLive } from '$lib/services/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from '$lib/services/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperLive';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import {
	NotificationService,
	TranscriptionService,
	WhisperingError,
} from '@repo/shared';
import { Effect, Option } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { recorderState } from './recorder.svelte';
import { settings } from './settings.svelte';

export const recordings = Effect.gen(function* () {
	const { notify, clear: clearNotification } = yield* NotificationService;
	const recordingsDb = yield* RecordingsDbService;
	const clipboardService = yield* ClipboardService;
	const { downloadBlob } = yield* DownloadService;

	let recordings = $state<Recording[]>([]);
	const updateRecording = (recording: Recording) =>
		Effect.gen(function* () {
			yield* recordingsDb.updateRecording(recording);
			recordings = recordings.map((r) =>
				r.id === recording.id ? recording : r,
			);
		});

	const syncDbToRecordingsState = Effect.gen(function* () {
		recordings = yield* recordingsDb.getAllRecordings;
	}).pipe(Effect.catchAll(renderErrorAsToast));
	syncDbToRecordingsState.pipe(Effect.runPromise);

	return {
		get value() {
			return recordings;
		},
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
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		deleteRecordingById: (id: string) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingById(id);
				recordings = recordings.filter((recording) => recording.id !== id);
				toast({
					variant: 'success',
					title: 'Recording deleted!',
					description: 'Your recording has been deleted successfully.',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		deleteRecordingsById: (ids: string[]) =>
			Effect.gen(function* () {
				yield* recordingsDb.deleteRecordingsById(ids);
				recordings = recordings.filter(
					(recording) => !ids.includes(recording.id),
				);
				toast({
					variant: 'success',
					title: 'Recordings deleted!',
					description: 'Your recordings have been deleted successfully.',
				});
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		transcribeRecording: (id: string) => {
			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];

			return Effect.gen(function* () {
				const transcriptionService = yield* TranscriptionService;
				const transcribingInProgressId = nanoid();
				toast({
					id: transcribingInProgressId,
					variant: 'loading',
					title: 'Transcribing recording...',
					description: 'Your recording is being transcribed.',
				});
				if (recorderState.value !== 'RECORDING') {
					recorderState.value = 'LOADING';
				}
				const isVisible = !document.hidden;

				if (!isVisible) {
					yield* notify({
						id: transcribingInProgressId,
						title: 'Transcribing recording...',
						description: 'Your recording is being transcribed.',
						action: {
							type: 'link',
							label: 'Go to recordings',
							goto: '/recordings',
						},
					});
				}

				const transcribedText = yield* Effect.gen(function* () {
					const maybeRecording = yield* recordingsDb.getRecording(id);
					if (Option.isNone(maybeRecording)) {
						return yield* new WhisperingError({
							title: `Recording with id ${id} not found`,
							description: 'Please try again.',
							action: { type: 'none' },
						});
					}
					const recording = maybeRecording.value;
					yield* updateRecording({
						...recording,
						transcriptionStatus: 'TRANSCRIBING',
					});
					const transcribedText = yield* transcriptionService
						.transcribe(recording.blob)
						.pipe(
							Effect.tapError(() =>
								updateRecording({
									...recording,
									transcriptionStatus: 'UNPROCESSED',
								}),
							),
						);

					yield* updateRecording({
						...recording,
						transcribedText,
						transcriptionStatus: 'DONE',
					});

					if (recorderState.value !== 'RECORDING') recorderState.value = 'IDLE';

					toast({
						variant: 'success',
						id: transcribingInProgressId,
						title: 'Transcription complete!',
						description: 'Check it out in your recordings',
						action: {
							label: 'Go to recordings',
							onClick: () => goto('/recordings'),
						},
					});

					yield* clearNotification(transcribingInProgressId);

					yield* notify({
						id: nanoid(),
						title: 'Transcription complete!',
						description: 'Click to check it out in your recordings',
						action: {
							type: 'link',
							label: 'Go to recordings',
							goto: '/recordings',
						},
					});

					return transcribedText;
				}).pipe(
					Effect.tapError((error) =>
						renderErrorAsToast(error, { toastId: transcribingInProgressId }),
					),
					Effect.catchAll(() => Effect.succeed('')),
				);

				if (transcribedText === '') return;

				// Copy transcription to clipboard if enabled
				if (settings.value.isCopyToClipboardEnabled) {
					yield* clipboardService.setClipboardText(transcribedText);
					toast({
						variant: 'success',
						title: 'Copied transcription to clipboard!',
						description: transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				}

				// Paste transcription if enabled
				if (settings.value.isPasteContentsOnSuccessEnabled) {
					yield* clipboardService.writeTextToCursor(transcribedText);
					toast({
						variant: 'success',
						title: 'Pasted transcription!',
						description: transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				}
			}).pipe(Effect.provide(selectedTranscriptionService));
		},
		downloadRecording: (id: string) =>
			Effect.gen(function* () {
				const maybeRecording = yield* recordingsDb.getRecording(id);
				if (Option.isNone(maybeRecording)) {
					return yield* new WhisperingError({
						title: `Recording with id ${id} not found`,
						description: 'Please try again.',
						action: { type: 'none' },
					});
				}
				const recording = maybeRecording.value;
				yield* downloadBlob({
					blob: recording.blob,
					name: `whispering_recording_${recording.id}`,
				});
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
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
}).pipe(Effect.provide(MainLive), Effect.runSync);
