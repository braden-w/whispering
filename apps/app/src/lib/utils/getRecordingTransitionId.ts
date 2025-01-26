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

export function getTransformationStepRunTransitionId({
	stepRunId,
	propertyName,
}: {
	stepRunId: string;
	propertyName: keyof TransformationRun;
}): string {
	return `transformation-run-${stepRunId}-${propertyName}` as const;
}
