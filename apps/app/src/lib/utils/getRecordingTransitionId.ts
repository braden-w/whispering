import type { Recording } from '$lib/services/db';

export function getRecordingTransitionId({
	recordingId,
	propertyName,
}: {
	recordingId: string;
	propertyName: keyof Recording | 'latestTransformationRunOutput';
}): string {
	return `recording-${recordingId}-${propertyName}` as const;
}
