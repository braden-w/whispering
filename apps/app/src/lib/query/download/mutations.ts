import { DownloadService } from '$lib/services';
import type { Recording } from '$lib/services/db';
import { toast } from '$lib/services/toast';
import { WhisperingErr } from '@repo/shared';
import { createMutation } from '@tanstack/svelte-query';

export function useDownloadIndexedDbBlobWithToast() {
	return {
		downloadIndexedDbBlobWithToast: createMutation(() => ({
			mutationFn: async ({ blob, name }: { blob: Blob; name: string }) => {
				const result = await DownloadService.downloadBlob({ name, blob });
				if (!result.ok) {
					toast.error(result.error);
					return result;
				}
				toast.success({
					title: 'IndexedDB dump downloaded!',
					description: 'Your IndexedDB dump is being downloaded.',
				});
				return result;
			},
		})),
	};
}

export function useDownloadRecordingWithToast() {
	return {
		downloadRecordingWithToast: createMutation(() => ({
			mutationFn: async (recording: Recording) => {
				if (!recording.blob) {
					const e = WhisperingErr({
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to download.",
					});
					toast.error(e.error);
					return e;
				}
				const result = await DownloadService.downloadBlob({
					name: `whispering_recording_${recording.id}`,
					blob: recording.blob,
				});
				if (!result.ok) {
					const e = WhisperingErr({
						title: 'Failed to download recording!',
						description: 'Your recording could not be downloaded.',
						action: { type: 'more-details', error: result.error },
					});
					toast.error(e.error);
					return e;
				}

				toast.success({
					title: 'Recording downloading!',
					description: 'Your recording is being downloaded.',
				});
				return result;
			},
		})),
	};
}
