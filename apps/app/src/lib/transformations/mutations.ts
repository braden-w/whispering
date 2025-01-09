import { queryClient } from '$lib/services';
import type { Transformation } from '$lib/services/db';
import { DbService, userConfiguredServices } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { createMutation } from '@tanstack/svelte-query';
import { transformationsKeys } from './queries';

export const createCreateTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (
			...params: Parameters<typeof DbService.createTransformation>
		) => {
			const result = await DbService.createTransformation(...params);
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
	}));

export const createUpdateTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (
			...params: Parameters<typeof DbService.updateTransformation>
		) => {
			const result = await DbService.updateTransformation(...params);
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
	}));

export const createDeleteTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (transformation: Transformation) => {
			const result = await DbService.deleteTransformation(transformation);
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
		onSuccess: (transformation) => {
			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [];
					return oldData.filter((item) => item.id !== transformation.id);
				},
			);
			queryClient.removeQueries({
				queryKey: transformationsKeys.byId(transformation.id),
			});

			toast.success({
				title: 'Deleted transformation!',
				description: 'Your transformation has been deleted successfully.',
			});
		},
	}));

export const createDeleteTransformationsWithToast = () =>
	createMutation(() => ({
		mutationFn: async (transformations: Transformation[]) => {
			const result = await DbService.deleteTransformations(transformations);
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
		onSuccess: (transformations) => {
			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [];
					const deletedIds = new Set(transformations.map((t) => t.id));
					return oldData.filter((item) => !deletedIds.has(item.id));
				},
			);
			for (const transformation of transformations) {
				queryClient.removeQueries({
					queryKey: transformationsKeys.byId(transformation.id),
				});
			}

			toast.success({
				title: 'Deleted transformations!',
				description: 'Your transformations have been deleted successfully.',
			});
		},
	}));
