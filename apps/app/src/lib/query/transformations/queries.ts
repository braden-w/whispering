import type { Transformation } from '$lib/services/db';
import {
	DbTransformationsService,
	createResultQuery,
	queryClient,
} from '$lib/services/index.js';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformations'] as const,
	byId: (id: string) => ['transformations', id] as const,
};

export const useTransformationsQuery = () =>
	createResultQuery(() => ({
		queryKey: transformationsKeys.all,
		queryFn: async () => {
			const result = await DbTransformationsService.getAllTransformations();
			return result;
		},
	}));

export const useTransformationQuery = (id: Accessor<string>) =>
	createResultQuery(() => ({
		queryKey: transformationsKeys.byId(id()),
		queryFn: async () => {
			const result = await DbTransformationsService.getTransformationById(id());
			return result;
		},
		initialData: () =>
			queryClient
				.getQueryData<Transformation[]>(transformationsKeys.all)
				?.find((t) => t.id === id()),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(transformationsKeys.byId(id()))?.dataUpdatedAt,
	}));
