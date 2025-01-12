import {
	DbTransformationsService,
	createResultQuery,
} from '$lib/services/index.js';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformationRuns'] as const,
	byId: (id: string) => ['transformationRuns', id] as const,
};

export const createTransformationRunsByIdQuery = (id: Accessor<string>) =>
	createResultQuery(() => ({
		queryKey: transformationsKeys.byId(id()),
		queryFn: async () => {
			const result =
				await DbTransformationsService.getTransformationRunsByTransformationId(
					id(),
				);
			return result;
		},
	}));
