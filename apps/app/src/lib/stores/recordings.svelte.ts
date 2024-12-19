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
import { recorderState } from './recorder.svelte';
import { settings } from './settings.svelte';

export const createRecordings = () => {
	let recordings = $state<Recording[]>([]);

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
		get value() {
			return recordings;
		},
		async addRecording(
			recording: Recording,
			{ onSuccess }: { onSuccess: () => void },
		) {
			const addRecordingResult =
				await RecordingsDbService.addRecording(recording);
			if (!addRecordingResult.ok) return renderErrAsToast(addRecordingResult);
			recordings.push(recording);
			onSuccess();
		},
		async updateRecording(
			recording: Recording,
			{
				onSuccess = () => {
					toast.success({
						title: 'Updated recording!',
						description: 'Your recording has been updated successfully.',
					});
				},
			}: { onSuccess?: () => void } = {},
		) {
			const updateRecordingResult = await updateRecording(recording);
			if (!updateRecordingResult.ok)
				return renderErrAsToast(updateRecordingResult);
			onSuccess();
		},
		async deleteRecordingById(
			id: string,
			{
				onSuccess = () => {
					toast.success({
						title: 'Deleted recording!',
						description: 'Your recording has been deleted successfully.',
					});
				},
			}: { onSuccess?: () => void } = {},
		) {
			const deleteRecordingResult =
				await RecordingsDbService.deleteRecordingById(id);
			if (!deleteRecordingResult.ok)
				return renderErrAsToast(deleteRecordingResult);
			recordings = recordings.filter((recording) => recording.id !== id);
			onSuccess();
		},
		async deleteRecordingsById(
			ids: string[],
			{
				onSuccess = () => {
					toast.success({
						title: 'Deleted recordings!',
						description: 'Your recordings have been deleted successfully.',
					});
				},
			}: { onSuccess?: () => void } = {},
		) {
			const deleteRecordingsResult =
				await RecordingsDbService.deleteRecordingsById(ids);
			if (!deleteRecordingsResult.ok)
				return renderErrAsToast(deleteRecordingsResult);
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
			const t = nanoid();

			const onTranscribeStart = () => {
				toast.loading({
					id: t,
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
				toast.dismiss(t);
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

			if (recorderState.value !== 'RECORDING') recorderState.value = 'LOADING';

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

			if (recorderState.value !== 'RECORDING') recorderState.value = 'IDLE';
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
				onSuccess = () => {
					toast.success({
						title: 'Recording downloaded!',
						description: 'Your recording has been downloaded successfully.',
					});
				},
			}: { onSuccess?: () => void } = {},
		) {
			const getRecordingResult = await RecordingsDbService.getRecording(id);
			if (!getRecordingResult.ok) return renderErrAsToast(getRecordingResult);
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
				onSuccess = (transcribedText) => {
					toast.success({
						title: 'Copied transcription to clipboard!',
						description: transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				},
			}: { onSuccess?: (transcribedText: string) => void } = {},
		) {
			if (recording.transcribedText === '') return Ok(undefined);
			const setClipboardTextResult = await ClipboardService.setClipboardText(
				recording.transcribedText,
			);
			if (!setClipboardTextResult.ok)
				return renderErrAsToast(setClipboardTextResult);
			onSuccess(recording.transcribedText);
		},
	};
};

export const recordings = createRecordings();
