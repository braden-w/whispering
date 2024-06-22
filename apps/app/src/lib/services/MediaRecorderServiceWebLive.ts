import { WhisperingError } from '@repo/shared';
import AudioRecorder from 'audio-recorder-polyfill';
import { Effect, Layer } from 'effect';
import { MediaRecorderService } from './MediaRecorderService.js';

export const MediaRecorderServiceWebLive = Layer.effect(
	MediaRecorderService,
	Effect.gen(function* () {
		let stream: MediaStream | null = null;
		let mediaRecorder: MediaRecorder | null = null;
		const recordedChunks: Blob[] = [];

		const resetRecorder = () => {
			recordedChunks.length = 0;
			stream?.getTracks().forEach((track) => track.stop());
			stream = null;
			mediaRecorder = null;
		};

		return {
			get recordingState() {
				if (!mediaRecorder) return 'inactive';
				return mediaRecorder.state;
			},
			enumerateRecordingDevices: Effect.tryPromise({
				try: async () => {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					const devices = await navigator.mediaDevices.enumerateDevices();
					stream.getTracks().forEach((track) => track.stop());
					const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
					return audioInputDevices;
				},
				catch: (error) =>
					new WhisperingError({
						title: 'Error enumerating recording devices',
						description: 'Please make sure you have given permission to access your audio devices',
						error: error,
					}),
			}),
			startRecording: (recordingDeviceId: string) =>
				Effect.gen(function* () {
					stream = yield* Effect.tryPromise({
						try: () =>
							navigator.mediaDevices.getUserMedia({
								audio: {
									deviceId: { exact: recordingDeviceId },
									channelCount: 1, // Mono audio is usually sufficient for voice recording
									sampleRate: 16000, // 16 kHz is a good balance for voice
									echoCancellation: true,
									noiseSuppression: true,
									autoGainControl: true,
								},
							}),
						catch: (error) =>
							new WhisperingError({
								title: 'Error getting media stream',
								description:
									'Please make sure you have given permission to access your audio devices',
								error: error,
							}),
					});
					recordedChunks.length = 0;
					mediaRecorder = new AudioRecorder(stream!, {
						mimeType: 'audio/webm;codecs=opus',
						sampleRate: 16000,
					});
					mediaRecorder!.addEventListener('dataavailable', (event: BlobEvent) => {
						if (!event.data.size) return;
						recordedChunks.push(event.data);
					});
					mediaRecorder!.start();
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
