import type { Transformation } from '$lib/services/db';
import { DbTransformationsService } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { createMutation } from '@tanstack/svelte-query';
import { queryClient } from '..';
import { transformationsKeys } from './queries';

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
