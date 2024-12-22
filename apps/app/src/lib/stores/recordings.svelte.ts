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
import { Ok, WhisperingErr, type WhisperingResult } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { recorder } from './recorder.svelte';
import { settings } from './settings.svelte';

export const createRecordings = () => {
	let recordings = $state<Recording[]>([]);
	let transcribingRecordingIds = $state<string[]>([]);

	const syncDbToRecordingsState = async () => {
		const getAllRecordingsResult = await RecordingsDbService.getAllRecordings();
		if (!getAllRecordingsResult.ok) {
			return renderErrAsToast(getAllRecordingsResult);
		}
		recordings = getAllRecordingsResult.data;
	};

	syncDbToRecordingsState();

	const updateRecording = async (
		recording: Recording,
	): Promise<WhisperingResult<void>> => {
		const updateRecordingResult =
			await RecordingsDbService.updateRecording(recording);

		if (!updateRecordingResult.ok) return updateRecordingResult;

		recordings = recordings.map((r) => (r.id === recording.id ? recording : r));

		return Ok(undefined);
	};

	return {
		get isTranscribing() {
			return transcribingRecordingIds.length > 0;
		},
		get value() {
			return recordings;
		},
		async addRecording(
			recording: Recording,
			{
				onSuccess,
				onError,
			}: { onSuccess: () => void; onError: (err: WhisperingErr) => void },
		) {
			const addRecordingResult =
				await RecordingsDbService.addRecording(recording);
			if (!addRecordingResult.ok) {
				onError(addRecordingResult);
			}
			recordings.push(recording);
			onSuccess();
		},
		async updateRecording(
			recording: Recording,
			{
				onStart,
				onSuccess,
				onError,
				onSettled,
			}:
				| {
						onStart?: undefined;
						onSuccess: () => void;
						onError: (err: WhisperingErr) => void;
						onSettled?: undefined;
				  }
				| {
						onStart: () => void;
						onSuccess: () => void;
						onError: (err: WhisperingErr) => void;
						onSettled: () => void;
				  },
		) {
			onStart?.();
			const updateRecordingResult = await updateRecording(recording);
			if (!updateRecordingResult.ok) {
				onError(updateRecordingResult);
				return;
			}
			onSuccess();
			onSettled?.();
		},
		async deleteRecordingById(
			id: string,
			{
				onStart,
				onSuccess,
				onError,
				onSettled,
			}:
				| {
						onStart?: undefined;
						onSuccess: () => void;
						onError: (err: WhisperingErr) => void;
						onSettled?: undefined;
				  }
				| {
						onStart: () => void;
						onSuccess: () => void;
						onError: (err: WhisperingErr) => void;
						onSettled: () => void;
				  },
		) {
			onStart?.();
			const deleteRecordingResult =
				await RecordingsDbService.deleteRecordingById(id);
			if (!deleteRecordingResult.ok) {
				onError(deleteRecordingResult);
				onSettled?.();
				return;
			}
			recordings = recordings.filter((recording) => recording.id !== id);
			onSuccess();
			onSettled?.();
		},
		async deleteRecordingsById(
			ids: string[],
			{
				onSuccess,
				onError,
			}: { onSuccess: () => void; onError: (err: WhisperingErr) => void },
		) {
			const deleteRecordingsResult =
				await RecordingsDbService.deleteRecordingsById(ids);
			if (!deleteRecordingsResult.ok) {
				onError(deleteRecordingsResult);
				return;
			}
			recordings = recordings.filter(
				(recording) => !ids.includes(recording.id),
			);
			onSuccess();
		},
		async transcribeRecording(
			id: string,
			{ toastId }: { toastId?: string } = {},
		) {
			const transcribingInProgressId = toastId ?? nanoid();
			const onTranscribeStart = () => {
			transcribingRecordingIds.push(transcribingInProgressId);
				toast.loading({
					id: transcribingInProgressId,
					title: 'Transcribing recording...',
					description: 'Your recording is being transcribed.',
				});
				const isVisible = !document.hidden;
				if (!isVisible) {
					NotificationService.notify({
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
			};

			const onTranscribeSuccess = () => {
				transcribingRecordingIds = transcribingRecordingIds.filter(
					(id) => id !== transcribingInProgressId,
				);
				NotificationService.clear(transcribingInProgressId);
				toast.success({
					id: transcribingInProgressId,
					title: 'Transcription complete!',
					description: 'Check it out in your recordings',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
				const isVisible = !document.hidden;
				if (!isVisible) {
					NotificationService.notify({
						id: transcribingInProgressId,
						title: 'Transcription complete!',
						description: 'Check it out in your recordings',
						action: {
							type: 'link',
							label: 'Go to recordings',
							goto: '/recordings',
						},
					});
				}
			};

			const onCopyToClipboardSuccess = () => {
				toast.success({
					id: transcribingInProgressId,
					title: 'Transcription completed and copied to clipboard!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			};

			const onPasteToCursorSuccess = () => {
				toast.success({
					id: transcribingInProgressId,
					title: 'Transcription completed and pasted to cursor!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						label: 'Go to recordings',
						onClick: () => goto('/recordings'),
					},
				});
			};

			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];


			onTranscribeStart();

			const tryTranscribeRecording = async () => {
				const getRecordingResult = await RecordingsDbService.getRecording(id);
				if (!getRecordingResult.ok) return getRecordingResult;
				const maybeRecording = getRecordingResult.data;
				if (maybeRecording === null) {
					return WhisperingErr({
						title: `Recording with id ${id} not found`,
						description: 'Please try again.',
						action: { type: 'none' },
					});
				}
				const recording = maybeRecording;

				const updateRecordingTranscribingResult = await updateRecording({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
				if (!updateRecordingTranscribingResult.ok) {
					return updateRecordingTranscribingResult;
				}

				const transcribeResult = await selectedTranscriptionService.transcribe(
					recording.blob,
				);
				if (!transcribeResult.ok) {
					const updateRecordingResult = await updateRecording({
						...recording,
						transcriptionStatus: 'UNPROCESSED',
					});
					if (!updateRecordingResult.ok) return updateRecordingResult;
					return transcribeResult;
				}
				const transcribedText = transcribeResult.data;

				const updateRecordingResult = await updateRecording({
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				});
				if (!updateRecordingResult.ok) return updateRecordingResult;
				return Ok(transcribedText);
			};

			const transcribeRecordingResult = await tryTranscribeRecording();

			if (!transcribeRecordingResult.ok) {
				return renderErrAsToast(transcribeRecordingResult);
			}
			onTranscribeSuccess();

			const transcribedText = transcribeRecordingResult.data;

			if (transcribedText === '') return;

			// Copy transcription to clipboard if enabled
			if (settings.value.isCopyToClipboardEnabled) {
				const setClipboardTextResult =
					await ClipboardService.setClipboardText(transcribedText);
				if (!setClipboardTextResult.ok)
					return renderErrAsToast(setClipboardTextResult);
				onCopyToClipboardSuccess();
			}

			// Paste transcription if enabled
			if (settings.value.isPasteContentsOnSuccessEnabled) {
				const clipboardWriteTextToCursorResult =
					await ClipboardService.writeTextToCursor(transcribedText);
				if (!clipboardWriteTextToCursorResult.ok)
					return renderErrAsToast(clipboardWriteTextToCursorResult);
				onPasteToCursorSuccess();
			}
		},
		async downloadRecording(
			id: string,
			{
				onSuccess,
				onError,
			}: { onSuccess: () => void; onError: (err: WhisperingErr) => void },
		) {
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) {
				onError(getRecordingResult);
				return;
			}
			const maybeRecording = getRecordingResult.data;
			if (maybeRecording === null) {
				return WhisperingErr({
					title: `Recording with id ${id} not found`,
					description: 'Please try again.',
					action: { type: 'none' },
				});
			}
			const recording = maybeRecording;
			const downloadBlobResult = await DownloadService.downloadBlob({
				blob: recording.blob,
				name: `whispering_recording_${recording.id}`,
			});
			if (!downloadBlobResult.ok) return renderErrAsToast(downloadBlobResult);
			onSuccess();
		},
		async copyRecordingText(
			recording: Recording,
			{
				onSuccess,
				onError,
			}: {
				onSuccess: (transcribedText: string) => void;
				onError: (err: WhisperingErr) => void;
			},
		) {
			if (recording.transcribedText === '') return;
			const setClipboardTextResult = await ClipboardService.setClipboardText(
				recording.transcribedText,
			);
			if (!setClipboardTextResult.ok) {
				onError(setClipboardTextResult);
				return;
			}
			onSuccess(recording.transcribedText);
		},
	};
};

export const recordings = createRecordings();
