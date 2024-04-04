import type { Recording } from '@repo/services/services/recordings-db';

export function createRecordingViewTransitionName({
	recordingId,
	propertyName
}: {
	recordingId: Recording['id'];
	propertyName: keyof Recording;
}): string {
	return `recording-${recordingId}-${propertyName}`;
}
