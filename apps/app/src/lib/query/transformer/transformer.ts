import { createResultMutation, playSoundIfEnabled } from '$lib/services';
import { RunTransformationService } from '$lib/services/index.js';
import { TransformErrorToWhisperingErr } from '$lib/services/runTransformation';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { queryClient } from '..';
import { maybeCopyAndPaste } from '../transcriber/transcriber';
import { transformationRunKeys } from '../transformationRuns/queries';
import { transformationsKeys } from '../transformations/queries';
import { getContext } from 'svelte';
import { setContext } from 'svelte';

export type Transformer = ReturnType<typeof createTransformer>;

export const initTransformerInContext = () => {
	const transformer = createTransformer();
	setContext('transformer', transformer);
	return transformer;
};

export const getTransformerFromContext = () => {
	return getContext<Transformer>('transformer');
};

const transformerKeys = {
	transformInput: ['transformer', 'transformInput'] as const,
	transformRecording: ['transformer', 'transformRecording'] as const,
};

export function createTransformer() {
	const transformInput = createResultMutation(() => ({
		mutationKey: transformerKeys.transformInput,
		mutationFn: async ({
			input,
			transformationId,
		}: {
			input: string;
			transformationId: string;
		}): Promise<WhisperingResult<string>> => {
			const transformationRunResult =
				await RunTransformationService.transformInput({
					input,
					transformationId,
				});

			if (!transformationRunResult.ok) {
				return TransformErrorToWhisperingErr(transformationRunResult);
			}

			const transformationRun = transformationRunResult.data;

			if (transformationRun.error) {
				return WhisperingErr({
					title: '⚠️ Transformation failed',
					description: 'Failed to apply the transformation on the input.',
					action: { type: 'more-details', error: transformationRun.error },
				});
			}

			if (!transformationRun.output) {
				return WhisperingErr({
					title: '⚠️ Transformation produced no output',
					description: 'The transformation completed but produced no output.',
				});
			}

			return Ok(transformationRun.output);
		},
		onSettled: (_data, _error, { transformationId }) => {
			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});
		},
	}));
	const transformRecording = createResultMutation(() => ({
		mutationKey: transformerKeys.transformRecording,
		mutationFn: async ({
			recordingId,
			transformationId,
		}: {
			recordingId: string;
			transformationId: string;
		}): Promise<WhisperingResult<string>> => {
			const transformationResult =
				await RunTransformationService.transformRecording({
					transformationId,
					recordingId,
				});

			if (!transformationResult.ok) {
				return WhisperingErr({
					title: '⚠️ Transformation failed',
					description: 'Failed to apply the transformation on the recording..',
					action: {
						type: 'more-details',
						error: transformationResult.error,
					},
				});
			}

			const transformationRun = transformationResult.data;
			if (transformationRun.error) {
				return WhisperingErr({
					title: '⚠️ Transformation error',
					description: 'Failed to apply the transformation on the recording.',
					action: {
						type: 'more-details',
						error: transformationRun.error,
					},
				});
			}

			if (!transformationRun.output) {
				return WhisperingErr({
					title: '⚠️ Transformation produced no output',
					description: 'The transformation completed but produced no output.',
				});
			}

			return Ok(transformationRun.output);
		},
		onSettled: (_data, _error, { recordingId, transformationId }) => {
			queryClient.invalidateQueries({
				queryKey: transformationRunKeys.runsByRecordingId(recordingId),
			});
			queryClient.invalidateQueries({
				queryKey:
					transformationRunKeys.runsByTransformationId(transformationId),
			});
			queryClient.invalidateQueries({
				queryKey: transformationsKeys.byId(transformationId),
			});
		},
	}));
	return {
		get isCurrentlyTransforming() {
			return (
				queryClient.isMutating({
					mutationKey: transformerKeys.transformInput,
				}) > 0 ||
				queryClient.isMutating({
					mutationKey: transformerKeys.transformRecording,
				}) > 0
			);
		},
		transformInput: async ({
			input,
			transformationId,
			toastId = nanoid(),
		}: {
			input: string;
			transformationId: string;
			toastId?: string;
		}) => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description: 'Applying your selected transformation to the input...',
			});
			return await transformInput.mutateAsync(
				{
					input,
					transformationId,
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: (output) => {
						void playSoundIfEnabled('transformationComplete');
						maybeCopyAndPaste({
							text: output,
							toastId,
							shouldCopy:
								settings.value['transformation.clipboard.copyOnSuccess'],
							shouldPaste:
								settings.value['transformation.clipboard.pasteOnSuccess'],
							statusToToastText: (status) => {
								switch (status) {
									case null:
										return '🔄 Transformation complete!';
									case 'COPIED':
										return '🔄 Transformation complete and copied to clipboard!';
									case 'COPIED+PASTED':
										return '🔄 Transformation complete, copied to clipboard, and pasted!';
								}
							},
						});
					},
				},
			);
		},
		transformRecording: async ({
			recordingId,
			transformationId,
			toastId = nanoid(),
		}: {
			recordingId: string;
			transformationId: string;
			toastId?: string;
		}) => {
			toast.loading({
				id: toastId,
				title: '🔄 Running transformation...',
				description:
					'Applying your selected transformation to the transcribed text...',
			});
			return await transformRecording.mutateAsync(
				{
					recordingId,
					transformationId,
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: (output) => {
						void playSoundIfEnabled('transformationComplete');
						maybeCopyAndPaste({
							text: output,
							toastId,
							shouldCopy:
								settings.value['transformation.clipboard.copyOnSuccess'],
							shouldPaste:
								settings.value['transformation.clipboard.pasteOnSuccess'],
							statusToToastText: (status) => {
								switch (status) {
									case null:
										return '🔄 Transformation complete!';
									case 'COPIED':
										return '🔄 Transformation complete and copied to clipboard!';
									case 'COPIED+PASTED':
										return '🔄 Transformation complete, copied to clipboard, and pasted!';
								}
							},
						});
					},
				},
			);
		},
	};
}
