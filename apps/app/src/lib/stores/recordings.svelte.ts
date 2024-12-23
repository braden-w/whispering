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
import type { MutationFn } from '@epicenterhq/result';
import type { WhisperingErrProperties } from '@repo/shared';
import { settings } from './settings.svelte';

type RecordingsService = {
	readonly isTranscribing: boolean;
	readonly value: Recording[];
	addRecording: MutationFn<Recording, void, WhisperingErrProperties>;
	updateRecording: MutationFn<Recording, void, WhisperingErrProperties>;
	deleteRecordingById: MutationFn<string, void, WhisperingErrProperties>;
	deleteRecordingsById: MutationFn<string[], void, WhisperingErrProperties>;
	transcribeRecording: MutationFn<string, void, WhisperingErrProperties>;
	downloadRecording: MutationFn<string, void, WhisperingErrProperties>;
	copyRecordingText: MutationFn<Recording, string, WhisperingErrProperties>;
};

export const createRecordings = (): RecordingsService => {
	let recordings = $state<Recording[]>([]);
	const transcribingRecordingIds = $state(new Set<string>());

	const syncDbToRecordingsState = async () => {
		const getAllRecordingsResult = await RecordingsDbService.getAllRecordings();
		if (!getAllRecordingsResult.ok) {
			return renderErrAsToast(getAllRecordingsResult);
		}
		recordings = getAllRecordingsResult.data;
	};

	syncDbToRecordingsState();

	return {
		get isTranscribing() {
			return transcribingRecordingIds.size > 0;
		},
		get value() {
			return recordings;
		},
		async addRecording(
			recording: Recording,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(recording);
			await RecordingsDbService.addRecording(recording, {
				onMutate: () => {},
				onSuccess: () => {
					recordings.push(recording);
					onSuccess();
				},
				onError,
				onSettled: () => {},
			});
			onSettled();
		},
		async updateRecording(
			recording: Recording,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(recording);
			await RecordingsDbService.updateRecording(recording, {
				onMutate: () => {},
				onSuccess: () => {
					recordings = recordings.map((r) =>
						r.id === recording.id ? recording : r,
					);
					onSuccess();
				},
				onError: (error) => {
					onError({
						_tag: 'WhisperingError',
						title: `Error updating recording ${recording.id}`,
						description: 'Please try again.',
						action: { type: 'more-details', error },
					});
				},
				onSettled: () => {},
			});
			onSettled();
		},
		async deleteRecordingById(
			id: string,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(id);

			await RecordingsDbService.deleteRecordingById(id, {
				onMutate: () => {},
				onSuccess: () => {
					recordings = recordings.filter((r) => r.id !== id);
					onSuccess();
				},
				onError,
				onSettled: () => {},
			});
			onSettled();
		},
		async deleteRecordingsById(
			ids: string[],
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(ids);
			await RecordingsDbService.deleteRecordingsById(ids, {
				onMutate: () => {},
				onSuccess: () => {
					recordings = recordings.filter(
						(recording) => !ids.includes(recording.id),
					);
					onSuccess();
				},
				onError,
				onSettled: () => {},
			});
			onSettled();
		},
		async transcribeRecording(
			id: string,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(id);
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
			const markNotTranscribingAndDismissToastAndNotification = async () => {
				const updatedRecordingWithUnprocessedStatus = {
					...recording,
					transcriptionStatus: 'UNPROCESSED',
				} satisfies Recording;
				await RecordingsDbService.updateRecording(
					updatedRecordingWithUnprocessedStatus,
					{
						onMutate: () => {},
						onSuccess: () => {
							recordings = recordings.map((r) =>
								r.id === recording.id
									? updatedRecordingWithUnprocessedStatus
									: r,
							);
						},
						onError: (_error) => {},
						onSettled: () => {},
					},
				);
				transcribingRecordingIds.delete(id);
				toast.dismiss(currentTranscribingRecordingToastId);
				NotificationService.clear(currentTranscribingRecordingToastId);
			};

			transcribingRecordingIds.add(id);
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) {
				await markNotTranscribingAndDismissToastAndNotification();
				onError({
					_tag: 'WhisperingError',
					title: `Error getting recording ${id} to transcribe`,
					description: 'Please try again.',
					action: { type: 'more-details', error: getRecordingResult.error },
				});
				onSettled();
				return;
			}
			const maybeRecording = getRecordingResult.data;
			if (maybeRecording === null) {
				await markNotTranscribingAndDismissToastAndNotification();
				onError({
					_tag: 'WhisperingError',
					title: `Recording with id ${id} not found to transcribe`,
					description: 'Please try again.',
					action: { type: 'none' },
				});
				onSettled();
				return;
			}
			const recording = maybeRecording;

			const updatedRecordingWithTranscribingStatus = {
				...recording,
				transcriptionStatus: 'TRANSCRIBING',
			} satisfies Recording;
			await RecordingsDbService.updateRecording(
				updatedRecordingWithTranscribingStatus,
				{
					onMutate: () => {},
					onSuccess: () => {
						recordings = recordings.map((r) =>
							r.id === recording.id
								? updatedRecordingWithTranscribingStatus
								: r,
						);
					},
					onError: (_error) => {
						toast.loading({
							id: currentTranscribingRecordingToastId,
							title: `Error updating recording ${id} to transcribing`,
							description: 'Still trying to transcribe...',
						});
					},
					onSettled: () => {},
				},
			);

			const transcribeResult = await selectedTranscriptionService.transcribe(
				recording.blob,
			);

			if (!transcribeResult.ok) {
				await markNotTranscribingAndDismissToastAndNotification();
				onError({
					_tag: 'WhisperingError',
					title: `Error transcribing recording ${id}`,
					description: 'Please try again.',
					action: { type: 'more-details', error: transcribeResult.error },
				});
				onSettled();
				return;
			}

			const transcribedText = transcribeResult.data;
			const updatedRecordingWithDoneStatus = {
				...recording,
				transcriptionStatus: 'DONE',
				transcribedText,
			} satisfies Recording;
			await RecordingsDbService.updateRecording(
				updatedRecordingWithDoneStatus,
				{
					onMutate: () => {},
					onSuccess: () => {
						recordings = recordings.map((r) =>
							r.id === recording.id ? updatedRecordingWithDoneStatus : r,
						);
					},
					onError: (error) => {
						toast.info({
							id: currentTranscribingRecordingToastId,
							title: `Error updating recording ${id} to done with transcribed text`,
							description: transcribedText,
						});
					},
					onSettled: () => {},
				},
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
				await ClipboardService.setClipboardText(transcribedText, {
					onMutate: () => {},
					onSuccess: () => {
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
					},
					onError: (error) => {
						toast.error({
							id: currentCopyingToClipboardToastId,
							title: 'Error copying transcription to clipboard',
							description: transcribedText,
							descriptionClass: 'line-clamp-2',
							action: {
								label: 'Go to recordings',
								onClick: () => goto('/recordings'),
							},
						});
					},
					onSettled: () => {},
				});
			}

			// Paste transcription if enabled
			if (settings.value.isPasteContentsOnSuccessEnabled) {
				const currentPastingToCursorToastId =
					`pasting-to-cursor-${id}` as const;
				await ClipboardService.writeTextToCursor(transcribedText, {
					onMutate: () => {},
					onSuccess: () => {
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
					},
					onError: (errProperties) => {
						toast.error({
							id: currentPastingToCursorToastId,
							title: 'Error pasting transcription to cursor',
							description: transcribedText,
							descriptionClass: 'line-clamp-2',
							action: {
								label: 'Go to recordings',
								onClick: () => goto('/recordings'),
							},
						});
					},
					onSettled: () => {},
				});
			}
			onSuccess();
			onSettled();
		},
		async downloadRecording(
			id: string,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(id);
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) {
				onError({
					_tag: 'WhisperingError',
					title: `Error getting recording ${id} to download`,
					description: 'Please try again.',
					action: { type: 'more-details', error: getRecordingResult.error },
				});
				onSettled();
				return;
			}
			const maybeRecording = getRecordingResult.data;
			if (maybeRecording === null) {
				onError({
					_tag: 'WhisperingError',
					title: `Recording with id ${id} not found to download`,
					description: 'Please try again.',
					action: { type: 'none' },
				});
				onSettled();
				return;
			}
			const recording = maybeRecording;
			const downloadBlobResult = await DownloadService.downloadBlob({
				blob: recording.blob,
				name: `whispering_recording_${recording.id}`,
			});
			if (!downloadBlobResult.ok) {
				onError({
					_tag: 'WhisperingError',
					title: `Error downloading recording ${id}`,
					description: 'Please try again.',
					action: { type: 'more-details', error: downloadBlobResult.error },
				});
				onSettled();
				return;
			}
			onSuccess();
			onSettled();
		},
		async copyRecordingText(
			recording: Recording,
			{ onMutate, onSuccess, onError, onSettled },
		) {
			onMutate(recording);
			if (recording.transcribedText === '') return;
			await ClipboardService.setClipboardText(recording.transcribedText, {
				onMutate: () => {},
				onSuccess: () => {
					onSuccess(recording.transcribedText);
				},
				onError: (errProperties) => {
					onError({
						_tag: 'WhisperingError',
						title: 'Error copying transcription to clipboard',
						description: recording.transcribedText,
						action: {
							type: 'more-details',
							error: errProperties,
						},
					});
				},
				onSettled: () => {},
			});
			onSettled();
		},
	};
};

export const recordings = createRecordings();
