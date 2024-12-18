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
import {
	BubbleErr,
	Ok,
	WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { toast as sonnerToast } from 'svelte-sonner';
import { recorderState } from './recorder.svelte';
import { settings } from './settings.svelte';

export const createRecordings = () => {
	const { notify, clear: clearNotification } = NotificationService;
	const clipboardService = ClipboardService;
	const { downloadBlob } = DownloadService;

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
		async addRecording(recording: Recording) {
			const addRecordingResult =
				await RecordingsDbService.addRecording(recording);
			if (!addRecordingResult.ok) return renderErrAsToast(addRecordingResult);
			recordings.push(recording);
			toast.success({
				title: 'Recording added!',
				description: 'Your recording has been added successfully.',
			});
		},
		async updateRecording(recording: Recording) {
			const updateRecordingResult = await updateRecording(recording);
			if (!updateRecordingResult.ok)
				return renderErrAsToast(updateRecordingResult);
			toast.success({
				title: 'Recording updated!',
				description: 'Your recording has been updated successfully.',
			});
		},
		async deleteRecordingById(id: string) {
			const deleteRecordingResult =
				await RecordingsDbService.deleteRecordingById(id);
			if (!deleteRecordingResult.ok)
				return renderErrAsToast(deleteRecordingResult);
			recordings = recordings.filter((recording) => recording.id !== id);
			toast.success({
				title: 'Recording deleted!',
				description: 'Your recording has been deleted successfully.',
			});
		},
		async deleteRecordingsById(ids: string[]) {
			const deleteRecordingsResult =
				await RecordingsDbService.deleteRecordingsById(ids);
			if (!deleteRecordingsResult.ok)
				return renderErrAsToast(deleteRecordingsResult);
			recordings = recordings.filter(
				(recording) => !ids.includes(recording.id),
			);
			toast.success({
				title: 'Recordings deleted!',
				description: 'Your recordings have been deleted successfully.',
			});
		},
		async transcribeRecording(id: string) {
			const selectedTranscriptionService = {
				OpenAI: TranscriptionServiceWhisperLive,
				Groq: TranscriptionServiceGroqLive,
				'faster-whisper-server': TranscriptionServiceFasterWhisperServerLive,
			}[settings.value.selectedTranscriptionService];

			const transcribingInProgressId = nanoid();
			toast.loading({
				id: transcribingInProgressId,
				title: 'Transcribing recording...',
				description: 'Your recording is being transcribed.',
			});
			if (recorderState.value !== 'RECORDING') {
				recorderState.value = 'LOADING';
			}
			const isVisible = !document.hidden;

			if (!isVisible) {
				notify({
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

			const transcribedTextResult: WhisperingResult<string> =
				await (async () => {
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
					if (!updateRecordingTranscribingResult.ok)
						return updateRecordingTranscribingResult;
					const transcribeResult =
						await selectedTranscriptionService.transcribe(recording.blob);
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

					if (recorderState.value !== 'RECORDING') recorderState.value = 'IDLE';

					toast.success({
						id: transcribingInProgressId,
						title: 'Transcription complete!',
						description: 'Check it out in your recordings',
						action: {
							label: 'Go to recordings',
							onClick: () => goto('/recordings'),
						},
					});

					clearNotification(transcribingInProgressId);

					notify({
						id: nanoid(),
						title: 'Transcription complete!',
						description: 'Click to check it out in your recordings',
						action: {
							type: 'link',
							label: 'Go to recordings',
							goto: '/recordings',
						},
					});

					return Ok(transcribedText);
				})();

			if (!transcribedTextResult.ok) {
				sonnerToast.dismiss(transcribingInProgressId);
				return renderErrAsToast(transcribedTextResult);
			}
			const transcribedText = transcribedTextResult.data;

			if (transcribedText === '') return;

			// Copy transcription to clipboard if enabled
			if (settings.value.isCopyToClipboardEnabled) {
				const setClipboardTextResult =
					await clipboardService.setClipboardText(transcribedText);
				if (!setClipboardTextResult.ok)
					return renderErrAsToast(setClipboardTextResult);
				toast.success({
					title: 'Copied transcription to clipboard!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
				});
			}

			// Paste transcription if enabled
			if (settings.value.isPasteContentsOnSuccessEnabled) {
				const clipboardWriteTextToCursorResult =
					await clipboardService.writeTextToCursor(transcribedText);
				if (!clipboardWriteTextToCursorResult.ok)
					return renderErrAsToast(clipboardWriteTextToCursorResult);
				toast.success({
					title: 'Pasted transcription!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
				});
			}
		},
		async downloadRecording(id: string) {
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
			const downloadBlobResult = await downloadBlob({
				blob: recording.blob,
				name: `whispering_recording_${recording.id}`,
			});
			if (!downloadBlobResult.ok) return renderErrAsToast(downloadBlobResult);
		},
		async copyRecordingText(recording: Recording) {
			if (recording.transcribedText === '') return Ok(undefined);
			const setClipboardTextResult = await clipboardService.setClipboardText(
				recording.transcribedText,
			);
			if (!setClipboardTextResult.ok)
				return renderErrAsToast(setClipboardTextResult);
			toast.success({
				title: 'Copied transcription to clipboard!',
				description: recording.transcribedText,
				descriptionClass: 'line-clamp-2',
			});
		},
	};
};

export const recordings = createRecordings();
