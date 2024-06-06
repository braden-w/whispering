import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { z } from 'zod';

export const recorderStateSchema = z.union([
	z.literal('IDLE'),
	z.literal('PAUSED'),
	z.literal('RECORDING'),
]);
export type RecorderState = z.infer<typeof recorderStateSchema>;

class RecorderError extends Data.TaggedError('RecorderError')<{
	message: string;
	origError?: unknown;
}> {}

class RecorderService {
	private stream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private recordedChunks: Blob[] = [];

	private resetRecorder() {
		this.recordedChunks.length = 0;
		this.stream?.getTracks().forEach((track) => track.stop());
		this.stream = null;
		this.mediaRecorder = null;
	}

	get recorderState() {
		if (!this.mediaRecorder) return 'IDLE';
		switch (this.mediaRecorder.state) {
			case 'recording':
				return 'RECORDING';
			case 'paused':
				return 'PAUSED';
			case 'inactive':
				return 'IDLE';
			default:
				return 'IDLE';
		}
	}

	startRecording(recordingDeviceId: string) {
		return Effect.gen(this, function* () {
			this.stream = yield* Effect.tryPromise({
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
			this.recordedChunks.length = 0;
			this.mediaRecorder = new AudioRecorder(this.stream);
			this.mediaRecorder!.addEventListener(
				'dataavailable',
				(event: BlobEvent) => {
					if (!event.data.size) return;
					this.recordedChunks.push(event.data);
				},
				{ once: true },
			);
			this.mediaRecorder!.start();
		});
	}

	cancelRecording() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		this.resetRecorder();
	}

	stopRecording() {
		return Effect.tryPromise({
			try: () =>
				new Promise<Blob>((resolve) => {
					if (!this.mediaRecorder) {
						throw new RecorderError({
							message: 'Media recorder is not initialized',
						});
					}
					this.mediaRecorder.addEventListener(
						'stop',
						() => {
							const audioBlob = new Blob(this.recordedChunks, { type: 'audio/wav' });
							resolve(audioBlob);
							this.resetRecorder();
						},
						{ once: true },
					);
					this.mediaRecorder.stop();
				}),
			catch: (error) =>
				new RecorderError({
					message: 'Error stopping media recorder and getting audio blob',
					origError: error,
				}),
		}).pipe(
			Effect.catchAll((error) => {
				this.resetRecorder();
				return error;
			}),
		);
	}

	enumerateRecordingDevices() {
		return Effect.tryPromise({
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
		});
	}
}

export const recorderService = new RecorderService();
