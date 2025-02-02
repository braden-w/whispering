import {
	createResultMutation,
	DbRecordingsService,
	playSoundIfEnabled,
} from '$lib/services';
import {
	DbTransformationsService,
	RunTransformationService,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import { queryClient } from '..';
import { transformationRunKeys } from '../transformationRuns/queries';
import type { Transformation, TransformationRun } from '$lib/services/db';
import { createMutation } from '@tanstack/svelte-query';
import { transformationsKeys } from './queries';
import type { Accessor } from '../types';
import { nanoid } from 'nanoid/non-secure';
import { maybeCopyAndPaste } from '../transcriber/transcriber';
import { TransformErrorToWhisperingErr } from '$lib/services/runTransformation';

export const transformationsMutationKeys = {
	transformInput: ({
		transformationId,
		input,
	}: {
		transformationId: string;
		input: string;
	}) => ['transformations', transformationId, 'input', input] as const,
	transformRecording: ({
		recordingId,
		transformationId,
	}: {
		recordingId: string;
		transformationId: string;
	}) =>
		['transformations', transformationId, 'recording', recordingId] as const,
};

export function useCreateTransformationWithToast() {
	return {
		createTransformationWithToast: createMutation(() => ({
			mutationFn: async (
				...params: Parameters<
					typeof DbTransformationsService.createTransformation
				>
			) => {
				const result = await DbTransformationsService.createTransformation(
					...params,
				);
				if (!result.ok) {
					toast.error({
						title: 'Failed to create transformation!',
						description: 'Your transformation could not be created.',
						action: { type: 'more-details', error: result.error },
					});
					throw result.error;
				}
				return result.data;
			},
			onSuccess: (transformation) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [transformation];
						return [...oldData, transformation];
					},
				);
				queryClient.setQueryData<Transformation>(
					transformationsKeys.byId(transformation.id),
					transformation,
				);

				toast.success({
					title: 'Created transformation!',
					description: 'Your transformation has been created successfully.',
				});
			},
		})),
	};
}

export function useUpdateTransformation() {
	return {
		updateTransformation: createMutation(() => ({
			mutationFn: async (transformation: Transformation) => {
				const result =
					await DbTransformationsService.updateTransformation(transformation);
				if (!result.ok) return result;

				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [transformation];
						return oldData.map((item) =>
							item.id === transformation.id ? transformation : item,
						);
					},
				);
				queryClient.setQueryData<Transformation>(
					transformationsKeys.byId(transformation.id),
					transformation,
				);

				return result;
			},
		})),
	};
}

export function useUpdateTransformationWithToast() {
	return {
		updateTransformationWithToast: createMutation(() => ({
			mutationFn: async (
				...params: Parameters<
					typeof DbTransformationsService.updateTransformation
				>
			) => {
				const result = await DbTransformationsService.updateTransformation(
					...params,
				);
				if (!result.ok) {
					toast.error({
						title: 'Failed to update transformation!',
						description: 'Your transformation could not be updated.',
						action: { type: 'more-details', error: result.error },
					});
					throw result.error;
				}
				return result.data;
			},
			onSuccess: (transformation) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [transformation];
						return oldData.map((item) =>
							item.id === transformation.id ? transformation : item,
						);
					},
				);
				queryClient.setQueryData<Transformation>(
					transformationsKeys.byId(transformation.id),
					transformation,
				);

				toast.success({
					title: 'Updated transformation!',
					description: 'Your transformation has been updated successfully.',
				});
			},
		})),
	};
}

export function useDeleteTransformationWithToast() {
	return {
		deleteTransformationWithToast: createMutation(() => ({
			mutationFn: async (transformation: Transformation) => {
				const result =
					await DbTransformationsService.deleteTransformation(transformation);
				if (!result.ok) {
					toast.error({
						title: 'Failed to delete transformation!',
						description: 'Your transformation could not be deleted.',
						action: { type: 'more-details', error: result.error },
					});
					throw result.error;
				}
				return transformation;
			},
			onSuccess: (deletedTransformation) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						return oldData.filter(
							(item) => item.id !== deletedTransformation.id,
						);
					},
				);
				queryClient.removeQueries({
					queryKey: transformationsKeys.byId(deletedTransformation.id),
				});

				if (
					deletedTransformation.id ===
					settings.value['transformations.selectedTransformationId']
				) {
					settings.value = {
						...settings.value,
						'transformations.selectedTransformationId': null,
					};
				}

				toast.success({
					title: 'Deleted transformation!',
					description: 'Your transformation has been deleted successfully.',
				});
			},
		})),
	};
}

export function useDeleteTransformationsWithToast() {
	return {
		deleteTransformationsWithToast: createMutation(() => ({
			mutationFn: async (transformations: Transformation[]) => {
				const result =
					await DbTransformationsService.deleteTransformations(transformations);
				if (!result.ok) {
					toast.error({
						title: 'Failed to delete transformations!',
						description: 'Your transformations could not be deleted.',
						action: { type: 'more-details', error: result.error },
					});
					throw result.error;
				}
				return transformations;
			},
			onSuccess: (deletedTransformations) => {
				queryClient.setQueryData<Transformation[]>(
					transformationsKeys.all,
					(oldData) => {
						if (!oldData) return [];
						const deletedIds = new Set(deletedTransformations.map((t) => t.id));
						return oldData.filter((item) => !deletedIds.has(item.id));
					},
				);
				for (const transformation of deletedTransformations) {
					queryClient.removeQueries({
						queryKey: transformationsKeys.byId(transformation.id),
					});
				}

				if (
					deletedTransformations.some(
						(t) =>
							t.id ===
							settings.value['transformations.selectedTransformationId'],
					)
				) {
					settings.value = {
						...settings.value,
						'transformations.selectedTransformationId': null,
					};
				}

				toast.success({
					title: 'Deleted transformations!',
					description: 'Your transformations have been deleted successfully.',
				});
			},
		})),
	};
}

export function useTransformInput() {
	const transformInput = createResultMutation(() => ({
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
	return {
		transformInputWithToast: async ({
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
	};
}

export function useTransformRecording() {
	const transformRecording = createResultMutation(() => ({
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
					action: { type: 'more-details', error: transformationResult.error },
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
		transformAndUpdateRecordingWithToastWithSoundWithCopyPaste: async ({
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
