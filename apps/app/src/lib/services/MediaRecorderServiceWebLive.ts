import AudioRecorder from 'audio-recorder-polyfill';
import { Effect, Layer } from 'effect';
import { MediaRecorderError, MediaRecorderService } from './MediaRecorderService';

const getStream = (recordingDeviceId: string) =>
	Effect.tryPromise({
		try: () =>
			navigator.mediaDevices.getUserMedia({
				audio: { deviceId: { exact: recordingDeviceId } },
			}),
		catch: (error) =>
			new MediaRecorderError({
				title: 'Error getting media stream',
				error: error,
			}),
	});

const enumerateRecordingDevices = Effect.tryPromise({
	try: async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const devices = await navigator.mediaDevices.enumerateDevices();
		stream.getTracks().forEach((track) => track.stop());
		const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
		return audioInputDevices;
	},
	catch: (error) =>
		new MediaRecorderError({
			title: 'Error enumerating recording devices',
			description: 'Please make sure you have given permission to access your audio devices',
			error: error,
		}),
});

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

		const startRecording = (recordingDeviceId: string) =>
			Effect.gen(function* () {
				stream = yield* getStream(recordingDeviceId);
				recordedChunks.length = 0;
				mediaRecorder = new AudioRecorder(stream!);
				(mediaRecorder!.ondataavailable = (event: BlobEvent) => {
					if (!event.data.size) return;
					recordedChunks.push(event.data);
				}),
					mediaRecorder!.start();
			});

		const stopRecording = Effect.tryPromise({
			try: () =>
				new Promise<Blob>((resolve) => {
					if (!mediaRecorder) {
						throw new MediaRecorderError({
							title: 'Media recorder is not initialized',
						});
					}
					mediaRecorder.addEventListener('stop', () => {
						const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
						resolve(audioBlob);
						resetRecorder();
					});
					mediaRecorder.stop();
				}),
			catch: (error) =>
				new MediaRecorderError({
					title: 'Error stopping media recorder and getting audio blob',
					error: error,
				}),
		}).pipe(
			Effect.catchAll((error) => {
				resetRecorder();
				return error;
			}),
		);

		const cancelRecording = Effect.tryPromise({
			try: () =>
				new Promise<void>((resolve) => {
					if (!mediaRecorder) {
						throw new MediaRecorderError({
							title: 'Media recorder is not initialized',
						});
					}
					mediaRecorder.addEventListener('stop', () => {
						resetRecorder();
						resolve();
					});
					mediaRecorder.stop();
				}),
			catch: (error) =>
				new MediaRecorderError({
					title: 'Error stopping media recorder',
					error: error,
				}),
		}).pipe(
			Effect.catchAll((error) => {
				resetRecorder();
				return error;
			}),
		);

		return {
			get recorderState() {
				if (!mediaRecorder) return 'IDLE';
				if (mediaRecorder.state === 'recording') return 'RECORDING';
				return 'IDLE';
			},
			enumerateRecordingDevices,
			startRecording,
			stopRecording,
			cancelRecording,
		};
	}),
);
