import type { Recording, TransformationRun } from '$lib/services/db';

export function getRecordingTransitionId({
	recordingId,
	propertyName,
}: {
	recordingId: string;
	propertyName: keyof Recording | 'latestTransformationRunOutput';
}): string {
	return `recording-${recordingId}-${propertyName}` as const;
}

export function getTransformationRunTransitionId({
	transformationRunId,
	propertyName,
}: {
	transformationRunId: string;
	propertyName: keyof TransformationRun;
}): string {
	return `transformation-run-${transformationRunId}-${propertyName}` as const;
}
