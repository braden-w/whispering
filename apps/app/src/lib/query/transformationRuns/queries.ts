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

export const useTransformationRunsByTransformationIdQuery = (
	id: Accessor<string>,
) =>
	createResultQuery(() => ({
		queryKey: transformationRunKeys.byTransformationId(id()),
		queryFn: () =>
			DbTransformationsService.getTransformationRunsByTransformationId(id()),
	}));

export const useTransformationRunsByRecordingIdQuery = (
	recordingId: Accessor<string>,
) =>
	createResultQuery(() => ({
		queryKey: transformationRunKeys.byRecordingId(recordingId()),
		queryFn: () =>
			DbTransformationsService.getTransformationRunsByRecordingId(
				recordingId(),
			),
	}));

export const useLatestTransformationRunByRecordingIdQuery = (
	recordingId: Accessor<string>,
) =>
	createResultQuery(() => ({
		queryKey: transformationRunKeys.byRecordingId(recordingId()),
		queryFn: () =>
			DbTransformationsService.getTransformationRunsByRecordingId(
				recordingId(),
			),
		select: (data) => data?.[0] ?? null,
	}));
