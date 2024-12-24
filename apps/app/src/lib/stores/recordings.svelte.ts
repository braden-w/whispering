import { ClipboardService } from '$lib/services/ClipboardService';
import { NotificationService } from '$lib/services/NotificationService';
import {
	type Recording,
	RecordingsDbService,
} from '$lib/services/RecordingDbService';
import { toast } from '$lib/services/ToastService';
import { TranscriptionServiceFasterWhisperServerLive } from '$lib/services/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from '$lib/services/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperLive';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok, createMutation } from '@epicenterhq/result';
import { type ToastOptions, WhisperingErr } from '@repo/shared';
import { settings } from './settings.svelte';

export const recordings = createRecordings();

function createRecordings() {
	let recordingsArray = $state<Recording[]>([]);
	const transcribingRecordingIds = $state(new Set<string>());

	const syncDbToRecordingsState = async () => {
		const getAllRecordingsResult = await RecordingsDbService.getAllRecordings();
		if (!getAllRecordingsResult.ok) {
			return renderErrAsToast(getAllRecordingsResult.error);
		}
		recordingsArray = getAllRecordingsResult.data;
	};

	syncDbToRecordingsState();

	const updateRecording = createMutation({
		mutationFn: RecordingsDbService.updateRecording,
		onSuccess: (_, { input: recording }) => {
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? recording : r,
			);
		},
		onError: (error) => renderErrAsToast(error),
	});

	const deleteRecordingById = createMutation({
		mutationFn: RecordingsDbService.deleteRecordingById,
		onSuccess: (_, { input: id }) => {
			recordingsArray = recordingsArray.filter((r) => r.id !== id);
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
		},
		onError: (error) => renderErrAsToast(error),
	});

	const deleteRecordingsById = createMutation({
		mutationFn: RecordingsDbService.deleteRecordingsById,
		onSuccess: (_, { input: ids }) => {
			recordingsArray = recordingsArray.filter(
				(recording) => !ids.includes(recording.id),
			);
			toast.success({
				title: 'Deleted recordings!',
				description: 'Your recordings have been deleted successfully.',
			});
		},
		onError: (error) => renderErrAsToast(error),
	});

	const transcribeRecording = createMutation({
		mutationFn: async (recording, { context: { succeedStatus } }) => {
			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];

			const transcribeResult = await selectedTranscriptionService.transcribe(
				recording.blob,
			);
			if (!transcribeResult.ok) {
				return WhisperingErr({
					...transcribeResult.error,
					_tag: 'WhisperingError',
				});
			}

			const transcribedText = transcribeResult.data;
			const newRecordingWithDoneStatus = {
				...recording,
				transcriptionStatus: 'DONE',
				transcribedText,
			} satisfies Recording;
			const updateRecordingWithDoneStatusResult =
				await RecordingsDbService.updateRecording(newRecordingWithDoneStatus);
			if (!updateRecordingWithDoneStatusResult.ok) {
				return updateRecordingWithDoneStatusResult;
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? newRecordingWithDoneStatus : r,
			);

			succeedStatus({
				title: 'Transcription complete!',
				description: 'Check it out in your recordings',
				action: {
					type: 'link',
					label: 'Go to recordings',
					goto: '/recordings',
				},
			});

			if (transcribedText === '') return Ok(undefined);

			// Copy transcription to clipboard if enabled
			if (settings.value.isCopyToClipboardEnabled) {
				const setClipboardTextResult =
					await ClipboardService.setClipboardText(transcribedText);
				if (!setClipboardTextResult.ok) {
					return WhisperingErr({
						_tag: 'WhisperingError',
						title: 'Error copying transcription to clipboard',
						description: transcribedText,
						action: {
							type: 'more-details',
							error: setClipboardTextResult.error,
						},
					});
				}
				succeedStatus({
					title: 'Transcription completed and copied to clipboard!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: '/recordings',
					},
				});
			}

			// Paste transcription if enabled
			if (settings.value.isPasteContentsOnSuccessEnabled) {
				const writeTextToCursorResult =
					await ClipboardService.writeTextToCursor(transcribedText);
				if (!writeTextToCursorResult.ok) {
					return WhisperingErr({
						_tag: 'WhisperingError',
						title: 'Error pasting transcription to cursor',
						description: transcribedText,
						action: {
							type: 'more-details',
							error: writeTextToCursorResult.error,
						},
					});
				}
				succeedStatus({
					title:
						'Transcription completed, copied to clipboard, and pasted to cursor!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: '/recordings',
					},
				});
			}

			return Ok(undefined);
		},
		onMutate: async (recording: Recording) => {
			const isDocumentVisible = () => !document.hidden;
			const currentTranscribingRecordingToastId =
				`transcribing-${recording.id}` as const;
			const createStatusUpdater =
				(variant: 'loading' | 'success') => (options: ToastOptions) => {
					if (isDocumentVisible()) {
						toast[variant]({
							...options,
							id: currentTranscribingRecordingToastId,
						});
					} else {
						NotificationService.notify({
							...options,
							id: currentTranscribingRecordingToastId,
							variant,
						});
					}
				};

			const updateStatus = createStatusUpdater('loading');
			const succeedStatus = createStatusUpdater('success');
			const dismissToast = () => {
				toast.dismiss(currentTranscribingRecordingToastId);
				NotificationService.clear(currentTranscribingRecordingToastId);
			};

			transcribingRecordingIds.add(recording.id);
			updateStatus({
				id: currentTranscribingRecordingToastId,
				title: 'Transcribing...',
				description: 'Your recording is being transcribed.',
				action: {
					type: 'link',
					label: 'Go to recordings',
					goto: '/recordings',
				},
			});
			const newRecorder = {
				...recording,
				transcriptionStatus: 'TRANSCRIBING',
			} satisfies Recording;
			const setTranscribingStatusResult =
				await RecordingsDbService.updateRecording(newRecorder);
			if (!setTranscribingStatusResult.ok) {
				updateStatus({
					title: `Error updating recording ${recording.id} to transcribing`,
					description: 'Still trying to transcribe...',
				});
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? newRecorder : r,
			);

			return Ok({ updateStatus, succeedStatus, dismissToast });
		},
		onError: async (error, { contextResult, input: recording }) => {
			if (!contextResult.ok) {
				const error = contextResult.error;
				renderErrAsToast(error);
				return;
			}
			const { dismissToast } = contextResult.data;
			const updatedRecordingWithUnprocessedStatus = {
				...recording,
				transcriptionStatus: 'UNPROCESSED',
			} satisfies Recording;
			const updateRecordingResult = await RecordingsDbService.updateRecording(
				updatedRecordingWithUnprocessedStatus,
			);
			if (!updateRecordingResult.ok) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error rolling back recording ${recording.id} to unprocessed`,
					description: 'Please try re-recording.',
					action: {
						type: 'more-details',
						error: updateRecordingResult.error,
					},
				});
				return updateRecordingResult;
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? updatedRecordingWithUnprocessedStatus : r,
			);
			transcribingRecordingIds.delete(recording.id);
			dismissToast();
			return Ok(recording);
		},
	});

	return {
		get isTranscribing() {
			return transcribingRecordingIds.size > 0;
		},
		get value() {
			return recordingsArray;
		},
		updateRecording,
		deleteRecordingById,
		deleteRecordingsById,
		transcribeRecording,
	};
}
