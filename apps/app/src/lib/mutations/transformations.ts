import type { Transformation } from '$lib/services/db';
import { userConfiguredServices } from '$lib/services/index.js';
import { toast } from '$lib/utils/toast';
import { createMutation } from '@tanstack/svelte-query';

export const createCreateTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (
			...params: Parameters<
				typeof userConfiguredServices.db.createTransformation
			>
		) => {
			const result = await userConfiguredServices.db.createTransformation(
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
			toast.success({
				title: 'Created transformation!',
				description: 'Your transformation has been created successfully.',
			});
			return result.data;
		},
	}));

export const createUpdateTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (
			...params: Parameters<
				typeof userConfiguredServices.db.updateTransformation
			>
		) => {
			const result = await userConfiguredServices.db.updateTransformation(
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
			toast.success({
				title: 'Updated transformation!',
				description: 'Your transformation has been updated successfully.',
			});
			return result.data;
		},
	}));

export const createDeleteTransformationWithToast = () =>
	createMutation(() => ({
		mutationFn: async (transformation: Transformation) => {
			const result =
				await userConfiguredServices.db.deleteTransformation(transformation);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete transformation!',
					description: 'Your transformation could not be deleted.',
					action: { type: 'more-details', error: result.error },
				});
				throw result.error;
			}
			toast.success({
				title: 'Deleted transformation!',
				description: 'Your transformation has been deleted successfully.',
			});
			return transformation;
		},
	}));

export const createDeleteTransformationsWithToast = () =>
	createMutation(() => ({
		mutationFn: async (transformations: Transformation[]) => {
			const result =
				await userConfiguredServices.db.deleteTransformations(transformations);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete transformations!',
					description: 'Your transformations could not be deleted.',
					action: { type: 'more-details', error: result.error },
				});
				throw result.error;
			}
			toast.success({
				title: 'Deleted transformations!',
				description: 'Your transformations have been deleted successfully.',
			});
			return transformations;
		},
	}));
