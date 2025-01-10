import type { Transformation } from '$lib/services/db';
import {
	DbService,
	createResultQuery,
	queryClient,
} from '$lib/services/index.js';

export type Accessor<T> = () => T;

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformations'] as const,
	byId: (id: string) => ['transformations', id] as const,
};

export const createTransformationsQuery = () =>
	createResultQuery(() => ({
		queryKey: transformationsKeys.all,
		queryFn: async () => {
			const result = await DbService.getAllTransformations();
			return result;
		},
	}));

export const createTransformationQuery = (id: Accessor<string>) =>
	createResultQuery(() => ({
		queryKey: transformationsKeys.byId(id()),
		queryFn: async () => {
			const result = await DbService.getTransformationById(id());
			return result;
		},
		initialData: () =>
			queryClient
				.getQueryData<Transformation[]>(transformationsKeys.all)
				?.find((t) => t.id === id()),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(transformationsKeys.byId(id()))?.dataUpdatedAt,
	}));
