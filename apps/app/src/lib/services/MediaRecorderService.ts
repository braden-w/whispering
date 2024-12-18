import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
import { toast } from '$lib/services/ToastService';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, type Result, tryAsync, trySync } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

const TIMESLICE_MS = 1000;

type MediaRecorderService = {
	readonly recordingState: RecordingState;
	startRecording: () => Promise<Result<undefined>>;
	stopRecording: () => Promise<Result<Blob>>;
	cancelRecording: () => Promise<Result<undefined>>;
};

export const mediaRecorder = createMediaRecorder();

export function createMediaRecorder(): MediaRecorderService {
	let mediaRecorder: MediaRecorder | null = null;
	const recordedChunks: Blob[] = [];

	const resetRecorder = () => {
		recordedChunks.length = 0;
		mediaRecorder = null;
		if (!settings.value.isFasterRerecordEnabled) {
			mediaStreamManager.destroy();
		}
	};

	return {
		get recordingState() {
			if (!mediaRecorder) return 'inactive';
			return mediaRecorder.state;
		},
		startRecording: async (): Promise<Result<undefined>> => {
			if (mediaRecorder) {
				return Err({
					_tag: 'WhisperingError',
					title: 'Unexpected media recorder already exists',
					description:
						'It seems like it was not properly deinitialized after the previous stopRecording or cancelRecording call.',
					action: { type: 'none' },
				});
			}
			const toastId = nanoid();
			const reinitializedMediaRecorderResult: Result<MediaRecorder> =
				await (async () => {
					const newOrExistingStreamResult = settings.value
						.isFasterRerecordEnabled
						? await mediaStreamManager.getOrRefreshStream()
						: await mediaStreamManager.refreshStream();
					if (!newOrExistingStreamResult.ok) return newOrExistingStreamResult;
					const newOrExistingStream = newOrExistingStreamResult.data;
					const newOrExistingMediaRecorderResult = trySync({
						try: () =>
							new MediaRecorder(newOrExistingStream, {
								bitsPerSecond: Number(settings.value.bitsPerSecond),
							}),
						catch: (error) => ({
							_tag: 'TryReuseStreamError',
							message:
								error instanceof Error
									? error.message
									: 'Error initializing media recorder with preferred device',
						}),
					});
					if (!newOrExistingMediaRecorderResult.ok) {
						toast({
							id: toastId,
							variant: 'loading',
							title: 'Error initializing media recorder with preferred device',
							description:
								'Trying to find another available audio input device...',
						});
						const newStreamResult = await mediaStreamManager.refreshStream();
						if (!newStreamResult.ok)
							return Err({
								_tag: 'WhisperingError',
								title:
									'Error initializing media recorder with preferred device',
								description: 'Please try again',
								action: { type: 'none' },
							});

						const newStream = newStreamResult.data;
						const newMediaRecorderResult: Result<MediaRecorder> = trySync({
							try: () =>
								new MediaRecorder(newStream, {
									bitsPerSecond: Number(settings.value.bitsPerSecond),
								}),
							catch: (error) => ({
								_tag: 'WhisperingError',
								title:
									'Error initializing media recorder with preferred device',
								description: 'Please try again',
								action: { type: 'more-details', error },
							}),
						});
						return newMediaRecorderResult;
					}
					return newOrExistingMediaRecorderResult;
				})();
			if (!reinitializedMediaRecorderResult.ok)
				return reinitializedMediaRecorderResult;
			const newMediaRecorder = reinitializedMediaRecorderResult.data;
			newMediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (!event.data.size) return;
				recordedChunks.push(event.data);
			});
			newMediaRecorder.start(TIMESLICE_MS);
			mediaRecorder = newMediaRecorder;
			return Ok(undefined);
		},
		async stopRecording() {
			const stopResult: Result<Blob> = await tryAsync({
				try: () =>
					new Promise<Blob>((resolve, reject) => {
						if (!mediaRecorder) {
							reject(new Error('No active media recorder'));
							return;
						}
						mediaRecorder.addEventListener('stop', () => {
							if (!mediaRecorder) {
								reject(
									new Error('Media recorder was nullified during stop event'),
								);
								return;
							}
							const audioBlob = new Blob(recordedChunks, {
								type: mediaRecorder.mimeType,
							});
							resolve(audioBlob);
						});
						mediaRecorder.stop();
					}),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Error stopping media recorder',
					description: 'Please try again',
					action: {
						type: 'more-details',
						error,
					},
				}),
			});
			resetRecorder();
			return stopResult;
		},
		cancelRecording: async () => {
			if (!mediaRecorder) return Ok(undefined);
			const cancelResult: Result<undefined> = await tryAsync({
				try: () =>
					new Promise<undefined>((resolve, reject) => {
						if (!mediaRecorder) {
							reject(new Error('No active media recorder'));
							return;
						}
						mediaRecorder.addEventListener('stop', () => {
							resetRecorder();
							resolve(undefined);
						});
						mediaRecorder.stop();
					}),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Error canceling media recorder',
					description: 'Please try again',
					action: {
						type: 'more-details',
						error,
					},
				}),
			});
			return cancelResult;
		},
	};
}
