import {
	useCopyTextToClipboard,
	useCopyTextToClipboardWithToast,
	useWriteTextToCursor,
} from '$lib/query/clipboard/mutations';
import { createResultMutation } from '$lib/services';
import type { Recording } from '$lib/services/db';
import {
	DbTransformationsService,
	RunTransformationService,
	playSoundIfEnabled,
	userConfiguredServices,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import {
	WHISPERING_RECORDINGS_PATHNAME,
	WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { queryClient } from '..';
import { useUpdateRecording } from '../recordings/mutations';
import { transcriberKeys } from './queries';

export function useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste({
	toastId = nanoid(),
}: {
	toastId?: string;
} = {}) {
	const updateRecording = useUpdateRecording();
	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();
	return createResultMutation(() => ({
		onMutate: async (recording) => {
			toast.loading({
				id: toastId,
				title: '📋 Transcribing...',
				description: 'Your recording is being transcribed...',
			});
			queryClient.setQueryData(transcriberKeys.isCurrentlyTranscribing, true);
			updateRecording.mutate(
				{
					...recording,
					transcriptionStatus: 'TRANSCRIBING',
				},
				{
					onError: (error) => {
						toast.warning({
							id: toastId,
							title:
								'⚠️ Unable to set recording transcription status to transcribing',
							description: 'Continuing with the transcription process...',
							action: { type: 'more-details', error },
						});
					},
				},
			);
		},
		mutationFn: async (recording: Recording) => {
			if (!recording.blob) {
				return WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to transcribe.",
				});
			}
			const transcriptionResult =
				await userConfiguredServices.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			return transcriptionResult;
		},
		onSuccess: async (transcribedText, recording) => {
			await updateRecording.mutateAsync(
				{
					...recording,
					transcribedText,
					transcriptionStatus: 'DONE',
				},
				{
					onError: (error) => {
						toast.error({
							id: toastId,
							title: '⚠️ Unable to update recording after transcription',
							description:
								"Transcription completed but unable to update recording's transcribed text and status in database",
							action: {
								type: 'more-details',
								error,
							},
						});
					},
				},
			);
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
			await copyIfSetPasteIfSet({
				transcribedText,
				toastId: toastId,
			});
		},
		onError: (error, recording) => {
			toast.error({ id: toastId, ...error });
			updateRecording.mutate({
				...recording,
				transcriptionStatus: 'FAILED',
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: transcriberKeys.isCurrentlyTranscribing,
			});
		},
	}));
}

export function useTransformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste(
	toastId: string,
) {
	const copyTextToClipboard = useCopyTextToClipboard();
	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();
	const writeTextToCursor = useWriteTextToCursor();

	return createResultMutation(() => ({
		onMutate: () => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description:
					'Applying your selected transformation to the transcribed text...',
			});
		},
		mutationFn: async ({
			transcribedText,
			recordingId,
			selectedTransformationId,
		}: {
			transcribedText: string;
			recordingId: string;
			selectedTransformationId: string;
		}): Promise<WhisperingResult<string>> => {
			const getTransformationResult =
				await DbTransformationsService.getTransformationById(
					selectedTransformationId,
				);
			if (!getTransformationResult.ok) {
				return WhisperingErr({
					title: '⚠️ Transformation not found',
					description:
						'Could not find the selected transformation. Using original transcription.',
				});
			}

			const transformation = getTransformationResult.data;
			if (!transformation) {
				return WhisperingErr({
					title: '⚠️ Transformation not found',
					description:
						'Could not find the selected transformation. Using original transcription.',
				});
			}

			const transformationResult =
				await RunTransformationService.runTransformation({
					recordingId,
					input: transcribedText,
					transformation,
				});

			if (!transformationResult.ok) {
				return WhisperingErr({
					title: '⚠️ Transformation failed',
					description:
						'Failed to apply the transformation. Using original transcription.',
				});
			}

			const transformationRun = transformationResult.data;
			if (transformationRun.error) {
				return WhisperingErr({
					title: '⚠️ Transformation error',
					description: transformationRun.error,
				});
			}

			if (!transformationRun.output) {
				return WhisperingErr({
					title: '⚠️ Transformation produced no output',
					description:
						'The transformation completed but produced no output. Using original transcription.',
				});
			}

			return Ok(transformationRun.output);
		},
		onError: (error) => {
			toast.error({
				id: toastId,
				...error,
			});
		},
		onSuccess: (transformedText, { recordingId, selectedTransformationId }) => {
			void playSoundIfEnabled('transformationComplete');
			await copyIfSetPasteIfSet({
				transcribedText: transformedText,
				toastId: toastId,
			});
		},
	}));
}

async function copyIfSetPasteIfSet({
	transcribedText,
	toastId,
}: {
	transcribedText: string;
	toastId: string;
}) {
	const copyTextToClipboard = useCopyTextToClipboard();
	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();
	const writeTextToCursor = useWriteTextToCursor();

	let status:
		| 'transcribed'
		| 'transcribedAndCopied'
		| 'transcribedAndCopiedAndPasted' = 'transcribed';

	const toastBasedOnStatus = () => {
		switch (status) {
			case 'transcribed':
				toast.success({
					id: toastId,
					title: '📝 Recording transcribed!',
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
				return;
			case 'transcribedAndCopied':
				toast.success({
					id: toastId,
					title: '📝 Recording transcribed and copied to clipboard!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return;
			case 'transcribedAndCopiedAndPasted':
				toast.success({
					id: toastId,
					title:
						'📝📋✍️ Recording transcribed, copied to clipboard, and pasted!',
					description: transcribedText,
					descriptionClass: 'line-clamp-2',
					action: {
						type: 'link',
						label: 'Go to recordings',
						goto: WHISPERING_RECORDINGS_PATHNAME,
					},
				});
				return;
		}
	};

	if (!settings.value['transcription.clipboard.copyOnSuccess']) {
		toastBasedOnStatus();
		return;
	}

	toast.loading({
		id: toastId,
		title: '⏳ Copying to clipboard...',
		description: 'Copying the transcribed text to your clipboard...',
	});
	await copyTextToClipboard.mutateAsync(transcribedText, {
		onSuccess: () => {
			status = 'transcribedAndCopied';
		},
		onError: (error) => {
			toast.warning({
				title: '⚠️ Clipboard Access Failed',
				description:
					'Could not copy text to clipboard. This may be due to browser restrictions or permissions. You can copy the text manually below.',
				action: { type: 'more-details', error },
			});
		},
	});

	if (!settings.value['transcription.clipboard.pasteOnSuccess']) {
		toastBasedOnStatus();
		return;
	}

	toast.loading({
		id: toastId,
		title: '⏳ Pasting ...',
		description: 'Pasting the transcription to your cursor...',
	});
	await writeTextToCursor.mutateAsync(transcribedText, {
		onError: (error) => {
			toast.warning({
				title: '⚠️ Paste Operation Failed',
				description:
					'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
				action: { type: 'more-details', error },
			});
		},
		onSuccess: () => {
			status = 'transcribedAndCopiedAndPasted';
		},
	});

	toastBasedOnStatus();
}
