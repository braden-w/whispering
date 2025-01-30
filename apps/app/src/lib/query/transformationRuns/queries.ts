import {
	DbTransformationsService,
	createResultQuery,
} from '$lib/services/index.js';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const transformationRunKeys = {
	all: ['transformationRuns'] as const,
	byTransformationId: (id: string) =>
		['transformationRuns', 'transformationId', id] as const,
	byRecordingId: (recordingId: string) =>
		['transformationRuns', 'recordingId', recordingId] as const,
};

export function useTransformationRunsByTransformationIdQuery(
	id: Accessor<string>,
) {
	return {
		transformationRunsByTransformationIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.byTransformationId(id()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByTransformationId(id()),
		})),
	};
}

export function useTransformationRunsByRecordingIdQuery(
	recordingId: Accessor<string>,
) {
	return {
		transformationRunsByRecordingIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.byRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
		})),
	};
}

export function useLatestTransformationRunByRecordingIdQuery(
	recordingId: Accessor<string>,
) {
	return {
		latestTransformationRunByRecordingIdQuery: createResultQuery(() => ({
			queryKey: transformationRunKeys.byRecordingId(recordingId()),
			queryFn: () =>
				DbTransformationsService.getTransformationRunsByRecordingId(
					recordingId(),
				),
			select: (data) => data.at(0),
		})),
	};
}
