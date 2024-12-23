import { goto } from '$app/navigation';
import { ClipboardService } from '$lib/services/ClipboardService';
import { DownloadService } from '$lib/services/DownloadService';
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

	return {
		get isTranscribing() {
			return transcribingRecordingIds.size > 0;
		},
		get value() {
			return recordingsArray;
		},
		async updateRecording(recording: Recording) {
			const updateRecordingResult =
				await RecordingsDbService.updateRecording(recording);
			if (!updateRecordingResult.ok) {
				return renderErrAsToast(updateRecordingResult.error);
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? recording : r,
			);
			toast.success({
				title: 'Updated recording!',
				description: 'Your recording has been updated successfully.',
			});
		},
		async deleteRecordingById(id: string) {
			const deleteRecordingResult =
				await RecordingsDbService.deleteRecordingById(id);
			if (!deleteRecordingResult.ok) {
				return renderErrAsToast(deleteRecordingResult.error);
			}
			recordingsArray = recordingsArray.filter((r) => r.id !== id);
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
		},
		async deleteRecordingsById(ids: string[]) {
			const deleteRecordingsByIdResult =
				await RecordingsDbService.deleteRecordingsById(ids);
			if (!deleteRecordingsByIdResult.ok) {
				return renderErrAsToast(deleteRecordingsByIdResult.error);
			}
			recordingsArray = recordingsArray.filter(
				(recording) => !ids.includes(recording.id),
			);
			toast.success({
				title: 'Deleted recordings!',
				description: 'Your recordings have been deleted successfully.',
			});
		},
		async transcribeRecording(id: string) {
			const isDocumentVisible = () => !document.hidden;
			const currentTranscribingRecordingToastId = `transcribing-${id}` as const;
			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];

			if (isDocumentVisible()) {
				toast.loading({
					id: currentTranscribingRecordingToastId,
					title: 'Transcribing...',
					description: 'Your recording is being transcribed.',
				});
			} else {
				NotificationService.notify({
					id: currentTranscribingRecordingToastId,
					title: 'Transcribing recording...',
					description: 'Your recording is being transcribed.',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: '/recordings',
					},
				});
			}
			const markNotTranscribingAndDismissToastAndNotification =
				async (): Promise<void> => {
					const updatedRecordingWithUnprocessedStatus = {
						...recording,
						transcriptionStatus: 'UNPROCESSED',
					} satisfies Recording;
					const updateRecordingResult =
						await RecordingsDbService.updateRecording(
							updatedRecordingWithUnprocessedStatus,
						);
					if (!updateRecordingResult.ok) {
						renderErrAsToast({
							_tag: 'WhisperingError',
							title: `Error rolling back recording ${id} to unprocessed`,
							description: 'Please try re-recording.',
							action: {
								type: 'more-details',
								error: updateRecordingResult.error,
							},
						});
						return;
					}
					recordingsArray = recordingsArray.map((r) =>
						r.id === recording.id ? updatedRecordingWithUnprocessedStatus : r,
					);
					transcribingRecordingIds.delete(id);
					toast.dismiss(currentTranscribingRecordingToastId);
					NotificationService.clear(currentTranscribingRecordingToastId);
				};

			transcribingRecordingIds.add(id);
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) {
				await markNotTranscribingAndDismissToastAndNotification();
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error getting recording ${id} to transcribe`,
					description: 'Please try again.',
					action: { type: 'more-details', error: getRecordingResult.error },
				});
				return;
			}
			const maybeRecording = getRecordingResult.data;
			if (maybeRecording === null) {
				await markNotTranscribingAndDismissToastAndNotification();
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Recording with id ${id} not found to transcribe`,
					description: 'Please try again.',
					action: { type: 'none' },
				});
				return;
			}
			const recording = maybeRecording;

			const updatedRecordingWithTranscribingStatus = {
				...recording,
				transcriptionStatus: 'TRANSCRIBING',
			} satisfies Recording;
			const updateRecordingWithTranscribingStatusResult =
				await RecordingsDbService.updateRecording(
					updatedRecordingWithTranscribingStatus,
				);
			if (!updateRecordingWithTranscribingStatusResult.ok) {
				return renderErrAsToast(
					updateRecordingWithTranscribingStatusResult.error,
				);
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? updatedRecordingWithTranscribingStatus : r,
			);
			toast.loading({
				id: currentTranscribingRecordingToastId,
				title: `Error updating recording ${id} to transcribing`,
				description: 'Still trying to transcribe...',
			});

			const transcribeResult = await selectedTranscriptionService.transcribe(
				recording.blob,
			);

			if (!transcribeResult.ok) {
				await markNotTranscribingAndDismissToastAndNotification();
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error transcribing recording ${id}`,
					description: 'Please try again.',
					action: { type: 'more-details', error: transcribeResult.error },
				});
				return;
			}

			const transcribedText = transcribeResult.data;
			const updatedRecordingWithDoneStatus = {
				...recording,
				transcriptionStatus: 'DONE',
				transcribedText,
			} satisfies Recording;
			const updateRecordingWithDoneStatusResult =
				await RecordingsDbService.updateRecording(
					updatedRecordingWithDoneStatus,
				);
			if (!updateRecordingWithDoneStatusResult.ok) {
				await markNotTranscribingAndDismissToastAndNotification();
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error updating recording ${id} to done with transcribed text`,
					description: transcribedText,
					action: { type: 'more-details', error: updateRecordingWithDoneStatusResult.error, },
				});
				return;
			}
			recordingsArray = recordingsArray.map((r) =>
				r.id === recording.id ? updatedRecordingWithDoneStatus : r,
			);

			await markNotTranscribingAndDismissToastAndNotification();
			if (isDocumentVisible()) {
				toast.success({
					title: 'Transcription complete!',
					description: 'Check it out in your recordings',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			} else {
				NotificationService.notify({
					title: 'Transcription complete!',
					description: 'Check it out in your recordings',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: '/recordings',
					},
				});
			}

			if (transcribedText === '') return;

			// Copy transcription to clipboard if enabled
			if (settings.value.isCopyToClipboardEnabled) {
				const currentCopyingToClipboardToastId =
					`copying-to-clipboard-${id}` as const;
				const setClipboardTextResult =
					await ClipboardService.setClipboardText(transcribedText);
				if (!setClipboardTextResult.ok) {
					renderErrAsToast({
						_tag: 'WhisperingError',
						title: 'Error copying transcription to clipboard',
						description: transcribedText,
						action: {
							type: 'more-details',
							error: setClipboardTextResult.error,
						},
					});
					return;
				}
				toast.success({
					id: currentCopyingToClipboardToastId,
					title: 'Transcription completed and copied to clipboard!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			}

			// Paste transcription if enabled
			if (settings.value.isPasteContentsOnSuccessEnabled) {
				const currentPastingToCursorToastId =
					`pasting-to-cursor-${id}` as const;
				const writeTextToCursorResult =
					await ClipboardService.writeTextToCursor(transcribedText);
				if (!writeTextToCursorResult.ok) {
					renderErrAsToast({
						_tag: 'WhisperingError',
						title: 'Error pasting transcription to cursor',
						description: transcribedText,
						action: {
							type: 'more-details',
							error: writeTextToCursorResult.error,
						},
					});
					return;
				}
				toast.success({
					id: currentPastingToCursorToastId,
					title: 'Transcription completed and pasted to cursor!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			}
		},
		async downloadRecording(id: string) {
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error getting recording ${id} to download`,
					description: 'Please try again.',
					action: { type: 'more-details', error: getRecordingResult.error },
				});
				return;
			}
			const maybeRecording = getRecordingResult.data;
			if (maybeRecording === null) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Recording with id ${id} not found to download`,
					description: 'Please try again.',
					action: { type: 'none' },
				});
				return;
			}
			const recording = maybeRecording;
			const downloadBlobResult = await DownloadService.downloadBlob({
				blob: recording.blob,
				name: `whispering_recording_${recording.id}`,
			});
			if (!downloadBlobResult.ok) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: `Error downloading recording ${id}`,
					description: 'Please try again.',
					action: { type: 'more-details', error: downloadBlobResult.error },
				});
				return;
			}
			toast.success({
				title: 'Recording downloaded!',
				description: 'Your recording has been downloaded successfully.',
			});
		},
		async copyRecordingText(recording: Recording) {
			if (recording.transcribedText === '') return;
			const setClipboardTextResult = await ClipboardService.setClipboardText(
				recording.transcribedText,
			);
			if (!setClipboardTextResult.ok) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: 'Error copying transcription to clipboard',
					description: recording.transcribedText,
					action: { type: 'more-details', error: setClipboardTextResult.error },
				});
				return;
			}
			toast.success({
				title: 'Copied transcription to clipboard!',
				description: recording.transcribedText,
				descriptionClass: 'line-clamp-2',
			});
		},
	};
}
