import {
	DownloadService,
	RecordingsService,
	userConfiguredServices,
} from '$lib/services.svelte';
import type { Recording } from '$lib/services/db/RecordingsService';
import { clipboard } from '$lib/utils/clipboard';
import { toast } from '$lib/utils/toast';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { settings } from './settings.svelte';

export type { Recording } from '$lib/services/db/RecordingsService';

export const recordings = createRecordings();

function createRecordings() {
	const transcribingRecordingIds = $state(new Set<string>());
	const isCurrentlyTranscribing = $derived(transcribingRecordingIds.size > 0);

	return {
		get value() {
			return RecordingsService.recordings;
		},
		get isCurrentlyTranscribing() {
			return isCurrentlyTranscribing;
		},

		updateRecordingWithToast: async (recording: Recording) => {
			const result = await RecordingsService.updateRecording(recording);
			if (!result.ok) {
				toast.error({
					title: 'Failed to update recording!',
					description: 'Your recording could not be updated.',
				});
				return;
			}
			toast.success({
				title: 'Updated recording!',
				description: 'Your recording has been updated successfully.',
			});
			return;
		},

		deleteRecordingWithToast: async (recording: Recording) => {
			const result = await RecordingsService.deleteRecording(recording);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recording!',
					description: 'Your recording could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
			return;
		},

		deleteRecordingsWithToast: async (recordings: Recording[]) => {
			const result = await RecordingsService.deleteRecordings(recordings);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recordings!',
					description: 'Your recordings could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recordings!',
				description: 'Your recordings have been deleted successfully.',
			});
			return;
		},

		transcribeAndUpdateRecordingWithToast: async (
			recording: Recording,
			{ toastId = nanoid() }: { toastId?: string } = {},
		) => {
			if (!recording.blob) {
				const whisperingErr = WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
				});
				toast.error(whisperingErr.error);
				return whisperingErr;
			}
			toast.loading({
				id: toastId,
				title: '📋 Transcribing...',
				description: 'Your recording is being transcribed...',
			});
			const setStatusTranscribingResult =
				await RecordingsService.updateRecording({
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				});
			if (!setStatusTranscribingResult.ok) {
				toast.warning({
					id: toastId,
					title:
						'⚠️ Unable to set recording transcription status to transcribing',
					description: 'Continuing with the transcription process...',
					action: {
						type: 'more-details',
						error: setStatusTranscribingResult.error,
					},
				});
			}
			transcribingRecordingIds.add(recording.id);
			const transcriptionResult =
				await userConfiguredServices.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			transcribingRecordingIds.delete(recording.id);
			if (!transcriptionResult.ok) {
				toast.error({
					id: toastId,
					...transcriptionResult.error,
				});
				return transcriptionResult;
			}
			const transcribedText = transcriptionResult.data;
			const updatedRecording = {
				...recording,
				transcribedText,
				transcriptionStatus: 'DONE',
			} satisfies Recording;
			const saveRecordingToDatabaseResult =
				await RecordingsService.updateRecording(updatedRecording);
			if (!saveRecordingToDatabaseResult.ok) {
				toast.error({
					id: toastId,
					title: '⚠️ Unable to update recording after transcription',
					description:
						"Transcription completed but unable to update recording's transcribed text and status in database",
					action: {
						type: 'more-details',
						error: saveRecordingToDatabaseResult.error,
					},
				});
				return saveRecordingToDatabaseResult;
			}

			void userConfiguredServices.sound.playTranscriptionCompleteSoundIfEnabled();
			toast.success({
				id: toastId,
				title: '📋 Recording transcribed!',
				description: transcribedText,
				descriptionClass: 'line-clamp-2',
				action: {
					type: 'button',
					label: 'Go to recordings',
					onClick: () =>
						clipboard.copyTextToClipboardWithToast({
							label: 'transcribed text',
							text: transcribedText,
						}),
				},
			});
			return Ok(updatedRecording);
		},

		downloadRecordingWithToast: async (recording: Recording) => {
			if (!recording.blob) {
				toast.error({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to download.",
				});
				return;
			}
			const result = await DownloadService.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
			if (!result.ok) {
				toast.error({
					title: 'Failed to download recording!',
					description: 'Your recording could not be downloaded.',
					action: { type: 'more-details', error: result.error },
				});
				return;
			}
			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
			return;
		},
	};
}
