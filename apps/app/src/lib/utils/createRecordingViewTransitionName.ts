import type { Recording } from '$lib/services/db';

export function createRecordingViewTransitionName({
	recordingId,
	propertyName,
}: {
	recordingId: string;
	propertyName: keyof Recording;
}): string {
	return `recording-${recordingId}-${propertyName}` as const;
}
