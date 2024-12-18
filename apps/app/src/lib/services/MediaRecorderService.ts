import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
import { toast } from '$lib/services/ToastService';
import { settings } from '$lib/stores/settings.svelte';
import {
	Ok,
	type WhisperingResult,
	WhisperingErr,
	tryAsyncWhispering,
	trySyncBubble,
	trySyncWhispering,
	type WhisperingRecordingState,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { renderErrAsToast } from './renderErrorAsToast';

const TIMESLICE_MS = 1000;

type MediaRecorderService = {
	readonly recordingState: WhisperingRecordingState;
	startRecording: () => Promise<WhisperingResult<undefined>>;
	stopRecording: () => Promise<WhisperingResult<Blob>>;
	cancelRecording: () => Promise<WhisperingResult<undefined>>;
};

export const mediaRecorder = createMediaRecorder();

export function createMediaRecorder(): MediaRecorderService {
	let recordingState = $state<WhisperingRecordingState>('IDLE');
	let mediaRecorder: MediaRecorder | null = null;
	const recordedChunks: Blob[] = [];

	const setMediaRecorder = (value: MediaRecorder | null) => {
		mediaRecorder = value;
		updateRecordingState(value);
	};

	const updateRecordingState = (recorder: MediaRecorder | null) => {
		if (!recorder) {
			recordingState = 'IDLE';
			return;
		}

		switch (recorder.state) {
			case 'recording':
				recordingState = 'RECORDING';
				break;
			case 'paused':
				recordingState = 'IDLE';
				break;
			case 'inactive':
				recordingState = 'IDLE';
				break;
		}
	};

	const resetRecorder = () => {
		recordedChunks.length = 0;
		setMediaRecorder(null);
		if (!settings.value.isFasterRerecordEnabled) {
			mediaStreamManager.destroy();
		}
	};

	return {
		get recordingState() {
			return recordingState;
		},

		async startRecording() {
			if (mediaRecorder) {
				return renderErrAsToast(
					WhisperingErr({
						title: 'Unexpected media recorder already exists',
						description:
							'It seems like it was not properly deinitialized after the previous stopRecording or cancelRecording call.',
						action: { type: 'none' },
					}),
				);
			}
			const toastId = nanoid();

			const getNewStream = async () => {
				const newStreamResult = await mediaStreamManager.refreshStream();
				if (!newStreamResult.ok) return newStreamResult;
				const newStream = newStreamResult.data;
				return Ok(newStream);
			};

			const getReusedStream = async () => {
				const existingStreamResult =
					await mediaStreamManager.getExistingStream();
				if (!existingStreamResult.ok) return existingStreamResult;
				const existingStream = existingStreamResult.data;
				if (!existingStream) {
					toast.loading({
						id: toastId,
						title: 'Error initializing media recorder with preferred device',
						description:
							'Trying to find another available audio input device...',
					});
					return await getNewStream();
				}
				return Ok(existingStream);
			};

			const newStreamResult = settings.value.isFasterRerecordEnabled
				? await getReusedStream()
				: await getNewStream();
			if (!newStreamResult.ok) return newStreamResult;
			const newStream = newStreamResult.data;

			const newMediaRecorderResult: WhisperingResult<MediaRecorder> =
				trySyncWhispering({
					try: () => {
						const recorder = new MediaRecorder(newStream, {
							bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
						});
						recorder.addEventListener('start', () =>
							updateRecordingState(recorder),
						);
						recorder.addEventListener('stop', () =>
							updateRecordingState(recorder),
						);
						recorder.addEventListener('pause', () =>
							updateRecordingState(recorder),
						);
						recorder.addEventListener('resume', () =>
							updateRecordingState(recorder),
						);
						recorder.addEventListener('dataavailable', (event: BlobEvent) => {
							if (!event.data.size) return;
							recordedChunks.push(event.data);
						});

						return recorder;
					},
					catch: (error) => ({
						_tag: 'WhisperingError',
						title: 'Error initializing media recorder with preferred device',
						description: 'Please try again',
						action: { type: 'more-details', error },
					}),
				});

			if (!newMediaRecorderResult.ok) return newMediaRecorderResult;

			const newMediaRecorder = newMediaRecorderResult.data;
			newMediaRecorder.start(TIMESLICE_MS);
			setMediaRecorder(newMediaRecorder);
			return Ok(undefined);
		},
		async stopRecording() {
			const stopResult: WhisperingResult<Blob> = await tryAsyncWhispering({
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
		async cancelRecording() {
			if (!mediaRecorder) return Ok(undefined);
			const cancelResult: WhisperingResult<undefined> =
				await tryAsyncWhispering({
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
			if (!settings.value.isFasterRerecordEnabled) {
				mediaStreamManager.destroy();
			}
			return cancelResult;
		},
	};
}
