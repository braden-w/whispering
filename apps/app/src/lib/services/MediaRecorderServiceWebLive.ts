import { settings } from '$lib/stores/settings.svelte.js';
import { WhisperingError } from '@repo/shared';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect, Either, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { MediaRecorderService } from './MediaRecorderService.js';
import { ToastService } from './ToastService.js';

class GetStreamError extends Data.TaggedError('GetStreamError')<{
	recordingDeviceId: string;
}> {}

export const MediaRecorderServiceWebLive = Layer.effect(
	MediaRecorderService,
	// @ts-ignore
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		let stream: MediaStream | null = null;
		let mediaRecorder: MediaRecorder | null = null;
		const recordedChunks: Blob[] = [];

		const resetRecorder = () => {
			recordedChunks.length = 0;
			stream?.getTracks().forEach((track) => track.stop());
			stream = null;
			mediaRecorder = null;
		};

		const enumerateRecordingDevices = Effect.tryPromise({
			try: async () => {
				const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const devices = await navigator.mediaDevices.enumerateDevices();
				allAudioDevicesStream.getTracks().forEach((track) => track.stop());
				const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
				return audioInputDevices;
			},
			catch: (error) =>
				new WhisperingError({
					title: 'Error enumerating recording devices',
					description: 'Please make sure you have given permission to access your audio devices',
					error: error,
				}),
		});

		const getStreamForDeviceId = (recordingDeviceId: string) =>
			Effect.tryPromise({
				try: async () => {
					const stream = await navigator.mediaDevices.getUserMedia({
						audio: {
							deviceId: { exact: recordingDeviceId },
							channelCount: 1, // Mono audio is usually sufficient for voice recording
							sampleRate: 16000, // 16 kHz is a good balance for voice
							echoCancellation: true,
							noiseSuppression: true,
						},
					});
					return stream;
				},
				catch: () => new GetStreamError({ recordingDeviceId }),
			});

		const getFirstAvailableStream = Effect.gen(function* () {
			const defaultingToFirstAvailableDeviceToastId = nanoid();
			yield* toast({
				id: defaultingToFirstAvailableDeviceToastId,
				variant: 'loading',
				title: 'No device selected or selected device is not available',
				description: 'Defaulting to first available audio input device...',
			});
			const recordingDevices = yield* enumerateRecordingDevices;
			for (const device of recordingDevices) {
				const deviceStream = yield* Effect.either(getStreamForDeviceId(device.deviceId));
				if (Either.isRight(deviceStream)) {
					settings.selectedAudioInputDeviceId = device.deviceId;
					yield* toast({
						id: defaultingToFirstAvailableDeviceToastId,
						variant: 'info',
						title: 'Defaulted to first available audio input device',
						description: device.label,
					});
					return deviceStream.right;
				}
			}
			return yield* new WhisperingError({
				title: 'No available audio input devices',
				description: 'Please make sure you have a microphone connected',
			});
		});

		return {
			get recordingState() {
				if (!mediaRecorder) return 'inactive';
				return mediaRecorder.state;
			},
			enumerateRecordingDevices,
			startRecording: (preferredRecordingDeviceId: string) =>
				Effect.gen(function* () {
					const maybeResusedStream =
						stream ??
						(yield* getStreamForDeviceId(preferredRecordingDeviceId).pipe(
							Effect.catchAll(() => getFirstAvailableStream),
						));
					if (mediaRecorder) {
						return yield* new WhisperingError({
							title: 'Unexpected media recorder already exists',
							description:
								'It seems like it was not properly deinitialized after the previous recording session',
						});
					}
					const newMediaRecorder = yield* Effect.try({
						try: () =>
							new AudioRecorder(maybeResusedStream, {
								mimeType: 'audio/webm;codecs=opus',
								sampleRate: 16000,
							}),
						catch: () =>
							Effect.gen(function* () {
								yield* toast({
									variant: 'loading',
									title: 'Error initializing media recorder with preferred device',
									description: 'Trying to find another available audio input device...',
								});
								const stream = yield* getFirstAvailableStream;
								return new AudioRecorder(stream, {
									mimeType: 'audio/webm;codecs=opus',
									sampleRate: 16000,
								});
							}),
					});
					newMediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
						if (!event.data.size) return;
						recordedChunks.push(event.data);
					});
					newMediaRecorder.start();
					mediaRecorder = newMediaRecorder;
				}),
			stopRecording: Effect.async<Blob, Error>((resume) => {
				if (!mediaRecorder) return;
				mediaRecorder.addEventListener('stop', () => {
					const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
					resume(Effect.succeed(audioBlob));
					resetRecorder();
				});
				mediaRecorder.stop();
			}).pipe(
				Effect.catchAll((error) => {
					resetRecorder();
					return new WhisperingError({
						title: 'Error canceling media recorder',
						description: error instanceof Error ? error.message : 'Please try again',
						error: error,
					});
				}),
			),
			cancelRecording: Effect.async<undefined, Error>((resume) => {
				if (!mediaRecorder) return;
				mediaRecorder.addEventListener('stop', () => {
					resetRecorder();
					resume(Effect.succeed(undefined));
				});
				mediaRecorder.stop();
			}).pipe(
				Effect.catchAll((error) => {
					resetRecorder();
					return new WhisperingError({
						title: 'Error stopping media recorder',
						description: error instanceof Error ? error.message : 'Please try again',
						error: error,
					});
				}),
			),
		};
	}),
);
