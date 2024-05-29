import AudioRecorder from 'audio-recorder-polyfill';
import { Effect, Layer } from 'effect';
import { RecorderError, RecorderService } from '../../services/recorder';

class GetNavigatorMediaError extends RecorderError {
	constructor({ message, origError }: { message: string; origError?: unknown }) {
		super({ message, origError });
	}
}

class StopMediaRecorderError extends RecorderError {
	constructor({ message, origError }: { message: string; origError?: unknown }) {
		super({ message, origError });
	}
}

class EnumerateRecordingDevicesError extends RecorderError {
	constructor({ message, origError }: { message: string; origError?: unknown }) {
		super({ message, origError });
	}
}

let stream: MediaStream;
let mediaRecorder: MediaRecorder;
const recordedChunks: Blob[] = [];

const getMediaStream = (recordingDeviceId: string) =>
	Effect.tryPromise({
		try: () =>
			navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: recordingDeviceId } } }),
		catch: (error) =>
			new GetNavigatorMediaError({
				message: 'Error getting media stream',
				origError: error,
			}),
	});

const resetRecorder = () => {
	recordedChunks.length = 0;
	stream.getTracks().forEach((track) => track.stop());
};

export const RecorderServiceLiveWeb = Layer.succeed(
	RecorderService,
	RecorderService.of({
		startRecording: (recordingDeviceId) =>
			Effect.gen(function* () {
				stream = yield* getMediaStream(recordingDeviceId);
				recordedChunks.length = 0;
				mediaRecorder = new AudioRecorder(stream);
				mediaRecorder.addEventListener(
					'dataavailable',
					(event: BlobEvent) => {
						if (!event.data.size) return;
						recordedChunks.push(event.data);
					},
					{ once: true },
				);
				mediaRecorder.start();
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
				new StopMediaRecorderError({
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
				new EnumerateRecordingDevicesError({
					message: 'Error enumerating recording devices',
					origError: error,
				}),
		}),
	}),
);
