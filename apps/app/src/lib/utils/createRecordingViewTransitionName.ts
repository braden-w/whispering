import type { Recording } from '$lib/stores/recordings.svelte';

export function createRecordingViewTransitionName({
	recordingId,
	propertyName,
}: {
	recordingId: string;
	propertyName: keyof Recording;
}): string {
	return `recording-${recordingId}-${propertyName}`;
}
