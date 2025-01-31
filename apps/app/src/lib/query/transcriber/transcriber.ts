import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
import { ClipboardService, createResultMutation } from '$lib/services';
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
	type WhisperingErrProperties,
	type WhisperingResult,
} from '@repo/shared';
import { createMutation } from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import { useUpdateRecording } from '../recordings/mutations';

export type Transcriber = ReturnType<typeof createTranscriber>;

export const initTranscriberInContext = () => {
	const transcriber = createTranscriber();
	setContext('transcriber', transcriber);
	return transcriber;
};

export const getTranscriberFromContext = () => {
	return getContext<Transcriber>('transcriber');
};

const transcriberKeys = {
	transcribe: ['transcriber', 'transcribe'] as const,
	transform: ['transcriber', 'transform'] as const,
} as const;

function createTranscriber() {
	const { copyTextToClipboardWithToast } = useCopyTextToClipboardWithToast();
	const { transcribeAndUpdateRecording } =
		useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste();
	const {
		transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste,
	} = useTransformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste();

	return {
		get isCurrentlyTranscribing() {
			return (
				queryClient.isMutating({
					mutationKey: transcriberKeys.transcribe,
				}) > 0
			);
		},
		get isCurrentlyTransforming() {
			return (
				queryClient.isMutating({
					mutationKey: transcriberKeys.transform,
				}) > 0
			);
		},
		transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste: async ({
			recording,
		}: {
			recording: Recording;
		}) => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '📋 Transcribing...',
				description: 'Your recording is being transcribed...',
			});
			transcribeAndUpdateRecording.mutate(
				{ recording },
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: async (text) => {
						void playSoundIfEnabled('transcriptionComplete');
						void maybeCopyAndPaste({
							text,
							toastId,
							shouldCopy:
								settings.value['transcription.clipboard.copyOnSuccess'],
							shouldPaste:
								settings.value['transcription.clipboard.pasteOnSuccess'],
							onToastAction: ({ status, toastId, text }) => {
								switch (status) {
									case null:
										return toast.success({
											id: toastId,
											title: '📝 Recording transcribed!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'button',
												label: 'Copy to clipboard',
												onClick: () =>
													copyTextToClipboardWithToast.mutate({
														label: 'transcribed text',
														text: text,
													}),
											},
										});
									case 'COPIED':
										return toast.success({
											id: toastId,
											title:
												'📝 Recording transcribed and copied to clipboard!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'link',
												label: 'Go to recordings',
												goto: WHISPERING_RECORDINGS_PATHNAME,
											},
										});
									case 'COPIED+PASTED':
										return toast.success({
											id: toastId,
											title:
												'📝📋✍️ Recording transcribed, copied to clipboard, and pasted!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'link',
												label: 'Go to recordings',
												goto: WHISPERING_RECORDINGS_PATHNAME,
											},
										});
								}
							},
						});
					},
				},
			);
		},
		transformAndUpdateRecordingWithToastWithSoundWithCopyPaste: async ({
			recording,
			selectedTransformationId,
		}: {
			recording: Recording;
			selectedTransformationId: string;
		}) => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description:
					'Applying your selected transformation to the transcribed text...',
			});
			transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste.mutate(
				{
					transcribedText: recording.transcribedText,
					selectedTransformationId,
					recordingId: recording.id,
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: (transformedText) => {
						void playSoundIfEnabled('transformationComplete');
						void maybeCopyAndPaste({
							text: transformedText,
							toastId,
							shouldCopy:
								settings.value['transformation.clipboard.copyOnSuccess'],
							shouldPaste:
								settings.value['transformation.clipboard.pasteOnSuccess'],
							onToastAction: ({ status, toastId, text }) => {
								switch (status) {
									case null:
										return toast.success({
											id: toastId,
											title: '🔄 Transformation complete!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'button',
												label: 'Copy to clipboard',
												onClick: () =>
													copyTextToClipboardWithToast.mutate({
														label: 'transcribed text',
														text: text,
													}),
											},
										});
									case 'COPIED':
										return toast.success({
											id: toastId,
											title:
												'🔄 Transformation complete and copied to clipboard!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'link',
												label: 'Go to recordings',
												goto: WHISPERING_RECORDINGS_PATHNAME,
											},
										});
									case 'COPIED+PASTED':
										return toast.success({
											id: toastId,
											title:
												'🔄 Transformation complete, copied to clipboard, and pasted!',
											description: text,
											descriptionClass: 'line-clamp-2',
											action: {
												type: 'link',
												label: 'Go to recordings',
												goto: WHISPERING_RECORDINGS_PATHNAME,
											},
										});
								}
							},
						});
					},
				},
			);
		},
	};
}

export function useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste() {
	const { updateRecording } = useUpdateRecording();
	return {
		transcribeAndUpdateRecording: createResultMutation(() => ({
			mutationKey: transcriberKeys.transcribe,
			onMutate: ({ recording }: { recording: Recording }) => {
				updateRecording.mutate(
					{ ...recording, transcriptionStatus: 'TRANSCRIBING' },
					{
						onError: (error) => {
							toast.warning({
								title:
									'⚠️ Unable to set recording transcription status to transcribing',
								description: 'Continuing with the transcription process...',
								action: { type: 'more-details', error },
							});
						},
					},
				);
			},
			mutationFn: async ({ recording }: { recording: Recording }) => {
				if (!recording.blob) {
					return WhisperingErr({
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to transcribe.",
					});
				}
				const transcriptionResult =
					await userConfiguredServices.transcription.transcribe(
						recording.blob,
						{
							outputLanguage: settings.value['transcription.outputLanguage'],
							prompt: settings.value['transcription.prompt'],
							temperature: settings.value['transcription.temperature'],
						},
					);
				return transcriptionResult;
			},
			onError: (_error, { recording }) => {
				updateRecording.mutate(
					{ ...recording, transcriptionStatus: 'FAILED' },
					{
						onError: (error) => {
							toast.error({
								title:
									'⚠️ Unable to set recording transcription status to failed',
								description:
									'Transcription failed and failed again to update recording transcription status to failed',
								action: { type: 'more-details', error },
							});
						},
					},
				);
			},
			onSuccess: (transcribedText, { recording }) => {
				updateRecording.mutate(
					{ ...recording, transcribedText, transcriptionStatus: 'DONE' },
					{
						onError: (error) => {
							toast.error({
								title: '⚠️ Unable to update recording after transcription',
								description:
									"Transcription completed but unable to update recording's transcribed text and status in database",
								action: { type: 'more-details', error },
							});
						},
					},
				);
			},
		})),
	};
}

export function useTransformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste() {
	return {
		transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste:
			createResultMutation(() => ({
				mutationKey: transcriberKeys.transform,
				mutationFn: async ({
					transcribedText,
					selectedTransformationId,
					recordingId,
				}: {
					transcribedText: string;
					selectedTransformationId: string;
					recordingId: string;
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
							input: transcribedText,
							transformation,
							recordingId,
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
			})),
	};
}

async function maybeCopyAndPaste({
	text,
	toastId,
	shouldCopy,
	shouldPaste,
	onToastAction,
}: {
	text: string;
	toastId: string;
	shouldCopy: boolean;
	shouldPaste: boolean;
	onToastAction: (params: {
		status: null | 'COPIED' | 'COPIED+PASTED';
		toastId: string;
		text: string;
	}) => void;
}) {
	if (!shouldCopy) return onToastAction({ status: null, toastId, text });

	const copyResult = await ClipboardService.setClipboardText(text);
	if (!copyResult.ok) {
		toast.warning({
			id: toastId,
			title: '⚠️ Clipboard Access Failed',
			description:
				'Could not copy text to clipboard. This may be due to browser restrictions or permissions. You can copy the text manually below.',
			action: { type: 'more-details', error: copyResult.error },
		});
		onToastAction({ status: null, toastId, text });
		return;
	}

	if (!shouldPaste) return onToastAction({ status: 'COPIED', toastId, text });

	const pasteResult = await ClipboardService.writeTextToCursor(text);
	if (!pasteResult.ok) {
		toast.warning({
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteResult.error },
		});
		onToastAction({ status: 'COPIED', toastId, text });
		return;
	}

	return onToastAction({ status: 'COPIED+PASTED', toastId, text });
}
