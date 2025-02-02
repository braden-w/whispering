import { ClipboardService, createResultMutation } from '$lib/services';
import type { Recording } from '$lib/services/db';
import {
	playSoundIfEnabled,
	userConfiguredServices,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { WHISPERING_RECORDINGS_PATHNAME, WhisperingErr } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import { copyTextToClipboardWithToast } from '../clipboard/mutations';
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
	const { updateRecording } = useUpdateRecording();

	const transcribeAndUpdateRecording = createResultMutation(() => ({
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
				await userConfiguredServices.transcription.transcribe(recording.blob, {
					outputLanguage: settings.value['transcription.outputLanguage'],
					prompt: settings.value['transcription.prompt'],
					temperature: settings.value['transcription.temperature'],
				});
			return transcriptionResult;
		},
		onError: (_error, { recording }) => {
			updateRecording.mutate(
				{ ...recording, transcriptionStatus: 'FAILED' },
				{
					onError: (error) => {
						toast.error({
							title: '⚠️ Unable to set recording transcription status to failed',
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
	}));

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
			toastId = nanoid(),
		}: {
			recording: Recording;
			toastId?: string;
		}) => {
			toast.loading({
				id: toastId,
				title: '📋 Transcribing...',
				description: 'Your recording is being transcribed...',
			});
			return await transcribeAndUpdateRecording.mutateAsync(
				{ recording },
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: async (transcribedText) => {
						void playSoundIfEnabled('transcriptionComplete');
						maybeCopyAndPaste({
							text: transcribedText,
							toastId,
							shouldCopy:
								settings.value['transcription.clipboard.copyOnSuccess'],
							shouldPaste:
								settings.value['transcription.clipboard.pasteOnSuccess'],
							statusToToastText(status) {
								switch (status) {
									case null:
										return '📝 Recording transcribed!';
									case 'COPIED':
										return '📝 Recording transcribed and copied to clipboard!';
									case 'COPIED+PASTED':
										return '📝📋✍️ Recording transcribed, copied to clipboard, and pasted!';
								}
							},
						});
					},
				},
			);
		},
	};
}

export async function maybeCopyAndPaste({
	text,
	toastId,
	shouldCopy,
	shouldPaste,
	statusToToastText,
}: {
	text: string;
	toastId: string;
	shouldCopy: boolean;
	shouldPaste: boolean;
	statusToToastText: (status: null | 'COPIED' | 'COPIED+PASTED') => string;
}) {
	const toastNull = () =>
		toast.success({
			id: toastId,
			title: statusToToastText(null),
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'button',
				label: 'Copy to clipboard',
				onClick: () =>
					copyTextToClipboardWithToast({
						label: 'transcribed text',
						text: text,
					}),
			},
		});

	const toastCopied = () =>
		toast.success({
			id: toastId,
			title: '📝 Recording transcribed and copied to clipboard!',
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});

	const toastCopiedAndPasted = () =>
		toast.success({
			id: toastId,
			title: statusToToastText('COPIED+PASTED'),
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});
	if (!shouldCopy) return toastNull();

	const copyResult = await ClipboardService.setClipboardText(text);
	if (!copyResult.ok) {
		toast.warning({
			id: toastId,
			title: '⚠️ Clipboard Access Failed',
			description:
				'Could not copy text to clipboard. This may be due to browser restrictions or permissions. You can copy the text manually below.',
			action: { type: 'more-details', error: copyResult.error },
		});
		toastNull();
		return;
	}

	if (!shouldPaste) return toastCopied();

	const pasteResult = await ClipboardService.writeTextToCursor(text);
	if (!pasteResult.ok) {
		toast.warning({
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteResult.error },
		});
		toastCopied();
		return;
	}

	toastCopiedAndPasted();
}
