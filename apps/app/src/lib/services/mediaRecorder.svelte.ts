import { mediaStream } from '$lib/services/mediaStream.svelte';
import { toast } from '$lib/services/ToastService';
import { settings } from '$lib/stores/settings.svelte';
import {
	Ok,
	WhisperingErr,
	tryAsyncWhispering,
	trySyncWhispering,
	type WhisperingRecordingState,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

const TIMESLICE_MS = 1000;

export const mediaRecorder = createMediaRecorder();

function createMediaRecorder() {
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
			mediaStream.destroy();
		}
	};

	return {
		get recordingState(): WhisperingRecordingState {
			return recordingState;
		},

		async startRecording({
			onSuccess,
			onError,
		}: {
			onSuccess: () => void;
			onError: (err: WhisperingErr) => void;
		}) {
			if (mediaRecorder) {
				onError(
					WhisperingErr({
						title: 'Unexpected media recorder already exists',
						description:
							'It seems like it was not properly deinitialized after the previous stopRecording or cancelRecording call.',
						action: { type: 'none' },
					}),
				);
			}
			const toastId = nanoid();

			const getNewStream = () => mediaStream.refreshStream();

			const getReusedStream = async () => {
				if (!mediaStream.stream) {
					toast.loading({
						id: toastId,
						title: 'Error initializing media recorder with preferred device',
						description:
							'Trying to find another available audio input device...',
					});
					return await getNewStream();
				}
				if (!mediaStream.stream.active) {
					toast.warning({
						id: toastId,
						title: 'Open stream is inactive',
						description: 'Refreshing recording session...',
					});
					return await getNewStream();
				}
				return Ok(mediaStream.stream);
			};

			const newStreamResult = settings.value.isFasterRerecordEnabled
				? await getReusedStream()
				: await getNewStream();
			if (!newStreamResult.ok) {
				onError(newStreamResult);
				return;
			}
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

			if (!newMediaRecorderResult.ok) {
				onError(newMediaRecorderResult);
				return;
			}

			const newMediaRecorder = newMediaRecorderResult.data;
			newMediaRecorder.start(TIMESLICE_MS);
			setMediaRecorder(newMediaRecorder);
			onSuccess();
		},
		async stopRecording({
			onSuccess,
			onError,
		}: {
			onSuccess: (audioBlob: Blob) => void;
			onError: (err: WhisperingErr) => void;
		}) {
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
			if (!stopResult.ok) {
				onError(stopResult);
				return;
			}
			const blob = stopResult.data;
			onSuccess(blob);
			resetRecorder();
		},
		async cancelRecording({
			onSuccess,
			onError,
		}: {
			onSuccess: () => void;
			onError: (err: WhisperingErr) => void;
		}) {
			if (!mediaRecorder) {
				onSuccess?.();
				return;
			}
			const cancelResult: WhisperingResult<undefined> =
				await tryAsyncWhispering({
					try: () =>
						new Promise<undefined>((resolve, reject) => {
							if (!mediaRecorder) {
								reject(new Error('No active media recorder'));
								return;
							}
							mediaRecorder.addEventListener('stop', () => {
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
				mediaStream.destroy();
			}
			if (!cancelResult.ok) {
				onError(cancelResult);
				resetRecorder();
				return;
			}
			onSuccess();
			resetRecorder();
		},
	};
}
