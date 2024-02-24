import type { Recording } from '@repo/recorder/services/recordings-db';

export function createRecordingViewTransitionName({
	recordingId,
	propertyName
}: {
	recordingId: Recording['id'];
	propertyName: keyof Recording;
}): string {
	return `recording-${recordingId}-${propertyName}`;
}
