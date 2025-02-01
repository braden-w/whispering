import { createResultMutation, DbRecordingsService } from '$lib/services';
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

export function useTransformInputWithToast() {
	return {
		transformInputWithToast: createResultMutation(() => ({
			mutationKey: transformationsMutationKeys.transformInput,
			mutationFn: async ({
				input,
				transformation,
			}: {
				input: string;
				transformation: Transformation;
			}) => {
				if (!input.trim()) {
					return WhisperingErr({
						title: 'No input provided',
						description: 'Please enter some text to transform',
					});
				}
				if (transformation.steps.length === 0) {
					return WhisperingErr({
						title: 'No steps configured',
						description: 'Please add at least one transformation step',
					});
				}

				const transformationRunResult =
					await RunTransformationService.transformInput({
						input,
						transformation,
					});

				if (!transformationRunResult.ok) {
					return WhisperingErr({
						title: 'Unexpected error while running transformation',
						description: 'See more details for the error',
						action: {
							type: 'more-details',
							error: transformationRunResult.error,
						},
					});
				}

				const transformationRun = transformationRunResult.data;
				queryClient.setQueryData<TransformationRun[]>(
					transformationRunKeys.runsByTransformationId(
						transformationRun.transformationId,
					),
					(oldData) => {
						if (!oldData) return [transformationRun];
						return [transformationRun, ...oldData];
					},
				);

				if (transformationRun.error) {
					return WhisperingErr({
						title: 'Transformation failed',
						description: transformationRun.error,
					});
				}

				return Ok(transformationRun.output);
			},
			onSuccess: (output) => {
				toast.success({
					title: 'Transformation complete',
					description: 'The text has been successfully transformed',
				});
			},
			onError: (error) => {
				toast.error({ ...error });
			},
		})),
	};
}

function useTransformRecording() {
	return {
		transformRecording: createResultMutation(() => ({
			mutationKey: transcriberKeys.transform,
			mutationFn: async ({
				selectedTransformationId,
				recordingId,
			}: {
				selectedTransformationId: string;
				recordingId: string;
			}): Promise<WhisperingResult<string>> => {
				const getTransformationResult =
					await DbTransformationsService.getTransformationById(
						selectedTransformationId,
					);
				if (!getTransformationResult.ok || !getTransformationResult.data) {
					return WhisperingErr({
						title: '⚠️ Transformation not found',
						description:
							'Could not find the selected transformation. Using original transcription.',
					});
				}

				const transformation = getTransformationResult.data;

				const getRecordingResult =
					await DbRecordingsService.getRecordingById(recordingId);
				if (!getRecordingResult.ok || !getRecordingResult.data) {
					return WhisperingErr({
						title: '⚠️ Recording not found',
						description: 'Could not find the recording..',
					});
				}

				const recording = getRecordingResult.data;

				const transformationResult =
					await RunTransformationService.transformRecording({
						transformation,
						recording,
					});

				if (!transformationResult.ok) {
					return WhisperingErr({
						title: '⚠️ Transformation failed',
						description:
							'Failed to apply the transformation on the recording..',
						action: { type: 'more-details', error: transformationResult.error },
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
			onSettled: (_data, _error, { recordingId }) => {
				queryClient.invalidateQueries({
					queryKey: transformationRunKeys.runsByRecordingId(recordingId),
				});
			},
		})),
	};
}
