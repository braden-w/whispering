import { recordingsKeys } from '$lib/queries/recordings';
import { transformationsKeys } from '$lib/queries/transformations';
import { queryClient } from '../../../routes/+layout.svelte';
import type { DbService } from './DbService';
import type { Recording, Transformation } from './DbService.dexie';

export * from './DbService';
export * from './DbService.dexie';

export const createDbFns = (DbService: DbService) =>
	({
		...DbService,
		createRecording: async (recording) => {
			const result = await DbService.createRecording(recording);
			if (!result.ok) return result;

			queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
				if (!oldData) return [result.data];
				return [...oldData, result.data];
			});

			return result;
		},
		updateRecording: async (recording) => {
			const result = await DbService.updateRecording(recording);
			if (!result.ok) return result;

			queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
				if (!oldData) return [result.data];
				return oldData.map((item) =>
					item.id === recording.id ? recording : item,
				);
			});

			return result;
		},
		deleteRecording: async (recording) => {
			const result = await DbService.deleteRecording(recording);
			if (!result.ok) return result;

			queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
				if (!oldData) return [];
				return oldData.filter((item) => item.id !== recording.id);
			});

			return result;
		},
		deleteRecordings: async (recordings) => {
			const result = await DbService.deleteRecordings(recordings);
			if (!result.ok) return result;

			queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
				if (!oldData) return [];
				const deletedIds = new Set(recordings.map((r) => r.id));
				return oldData.filter((item) => !deletedIds.has(item.id));
			});

			return result;
		},
		createTransformation: async (transformation) => {
			const result = await DbService.createTransformation(transformation);
			if (!result.ok) return result;

			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [result.data];
					return [...oldData, result.data];
				},
			);
			return result;
		},
		updateTransformation: async (transformation) => {
			const result = await DbService.updateTransformation(transformation);
			if (!result.ok) return result;

			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [result.data];
					return oldData.map((item) =>
						item.id === transformation.id ? transformation : item,
					);
				},
			);
			return result;
		},
		deleteTransformation: async (transformation) => {
			const result = await DbService.deleteTransformation(transformation);
			if (!result.ok) return result;

			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [];
					return oldData.filter((item) => item.id !== transformation.id);
				},
			);
			return result;
		},
		deleteTransformations: async (transformations) => {
			const result = await DbService.deleteTransformations(transformations);
			if (!result.ok) return result;

			queryClient.setQueryData<Transformation[]>(
				transformationsKeys.all,
				(oldData) => {
					if (!oldData) return [];
					const deletedIds = new Set(transformations.map((t) => t.id));
					return oldData.filter((item) => !deletedIds.has(item.id));
				},
			);
			return result;
		},
	}) satisfies DbService;
