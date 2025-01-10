import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
import type { Recording } from '$lib/services/db';
import {
	DbRecordingsService,
	playSoundIfEnabled,
	userConfiguredServices,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { settings } from './settings.svelte';

export const transcriber = createTranscriber();

function createTranscriber() {
	const transcribingRecordingIds = $state(new Set<string>());
	const isCurrentlyTranscribing = $derived(transcribingRecordingIds.size > 0);

	return {
		get isCurrentlyTranscribing() {
			return isCurrentlyTranscribing;
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
			const recordingWithTranscribingStatus = {
				...recording,
				transcriptionStatus: 'TRANSCRIBING',
			} as const satisfies Recording;
			const setStatusTranscribingResult =
				await DbRecordingsService.updateRecording(
					recordingWithTranscribingStatus,
				);

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
				const failedRecording = {
					...recording,
					transcriptionStatus: 'FAILED',
				} as const satisfies Recording;
				await DbRecordingsService.updateRecording(failedRecording);
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
			} as const satisfies Recording;
			const saveRecordingToDatabaseResult =
				await DbRecordingsService.updateRecording(updatedRecording);
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

			void playSoundIfEnabled('transcriptionComplete');
			toast.success({
				id: toastId,
				title: '📋 Recording transcribed!',
				description: transcribedText,
				descriptionClass: 'line-clamp-2',
				action: {
					type: 'button',
					label: 'Copy to clipboard',
					onClick: () =>
						copyTextToClipboardWithToast.mutate({
							label: 'transcribed text',
							text: transcribedText,
						}),
				},
			});
			return Ok(updatedRecording);
		},
	};
}
