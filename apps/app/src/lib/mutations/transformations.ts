import { transformationsKeys } from '$lib/queries/transformations';
import { DbService } from '$lib/services.svelte';
import type { Transformation } from '$lib/services/db';
import { toast } from '$lib/utils/toast';
import { createMutation, useQueryClient } from '@tanstack/svelte-query';

export const createCreateTransformationWithToast = () => {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: async (
			...params: Parameters<typeof DbService.createTransformation>
		) => {
			const result = await DbService.createTransformation(...params);
			if (!result.ok) {
				toast.error({
					title: 'Failed to create transformation!',
					description: 'Your transformation could not be created.',
				});
				throw result.error;
			}
			toast.success({
				title: 'Created transformation!',
				description: 'Your transformation has been created successfully.',
			});
			return result.data;
		},
		onSuccess: (newTransformation) => {
			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [newTransformation];
					return [...oldData, newTransformation];
				},
			);
		},
	}));
};

export const createUpdateTransformationWithToast = () => {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: async (
			...params: Parameters<typeof DbService.updateTransformation>
		) => {
			const result = await DbService.updateTransformation(...params);
			if (!result.ok) {
				toast.error({
					title: 'Failed to update transformation!',
					description: 'Your transformation could not be updated.',
				});
				throw result.error;
			}
			toast.success({
				title: 'Updated transformation!',
				description: 'Your transformation has been updated successfully.',
			});
			return result.data;
		},
		onSuccess: (updatedTransformation) => {
			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [updatedTransformation];
					return oldData.map((item) =>
						item.id === updatedTransformation.id ? updatedTransformation : item,
					);
				},
			);
		},
	}));
};

export const createDeleteTransformationWithToast = () => {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: async (transformation: Transformation) => {
			const result = await DbService.deleteTransformation(transformation);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete transformation!',
					description: 'Your transformation could not be deleted.',
				});
				throw result.error;
			}
			toast.success({
				title: 'Deleted transformation!',
				description: 'Your transformation has been deleted successfully.',
			});
			return transformation;
		},
		onSuccess: (deletedTransformation) => {
			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [];
					return oldData.filter((item) => item.id !== deletedTransformation.id);
				},
			);
		},
	}));
};
