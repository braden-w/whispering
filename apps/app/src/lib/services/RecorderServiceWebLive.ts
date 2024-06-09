import AudioRecorder from 'audio-recorder-polyfill';
import { Effect, Layer } from 'effect';
import { RecorderError, RecorderService } from './RecorderService';

export const RecorderServiceWebLive = Layer.effect(
	RecorderService,
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
			recorderState: Effect.sync(() => {
				if (!mediaRecorder) return 'IDLE';
				switch (mediaRecorder.state) {
					case 'recording':
						return 'RECORDING';
					case 'paused':
						return 'PAUSED';
					case 'inactive':
						return 'IDLE';
				}
			}),
			startRecording: (recordingDeviceId) =>
				Effect.gen(function* () {
					stream = yield* Effect.tryPromise({
						try: () =>
							navigator.mediaDevices.getUserMedia({
								audio: { deviceId: { exact: recordingDeviceId } },
							}),
						catch: (error) =>
							new RecorderError({
								message: 'Error getting media stream',
								origError: error,
							}),
					});
					recordedChunks.length = 0;
					mediaRecorder = new AudioRecorder(stream);
					mediaRecorder!.addEventListener(
						'dataavailable',
						(event: BlobEvent) => {
							if (!event.data.size) return;
							recordedChunks.push(event.data);
						},
						{ once: true },
					);
					mediaRecorder!.start();
				}),
			cancelRecording: Effect.sync(() => {
				if (mediaRecorder && mediaRecorder.state !== 'inactive') {
					mediaRecorder.stop();
				}
				resetRecorder();
			}),
			stopRecording: Effect.tryPromise({
				try: () =>
					new Promise<Blob>((resolve) => {
						if (!mediaRecorder) {
							throw new RecorderError({
								title: 'Media recorder is not initialized',
							});
						}
						mediaRecorder.addEventListener(
							'stop',
							() => {
								const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
								resolve(audioBlob);
								resetRecorder();
							},
							{ once: true },
						);
						mediaRecorder.stop();
					}),
				catch: (error) =>
					new RecorderError({
						message: 'Error stopping media recorder and getting audio blob',
						origError: error,
					}),
			}).pipe(
				Effect.catchAll((error) => {
					resetRecorder();
					return error;
				}),
			),
			enumerateRecordingDevices: Effect.tryPromise({
				try: async () => {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					const devices = await navigator.mediaDevices.enumerateDevices();
					stream.getTracks().forEach((track) => track.stop());
					const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
					return audioInputDevices;
				},
				catch: (error) =>
					new RecorderError({
						message: 'Error enumerating recording devices',
						origError: error,
					}),
			}),
		};
	}),
);
