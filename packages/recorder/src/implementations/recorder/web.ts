import AudioRecorder from 'audio-recorder-polyfill';
import type { Context } from 'effect';
import { Effect } from 'effect';
import type { RecorderService } from '../../services/recorder';
import { GetNavigatorMediaError, StopMediaRecorderError } from '../../services/recorder';

let stream: MediaStream;
let mediaRecorder: MediaRecorder;
const recordedChunks: Blob[] = [];

export const webRecorderService: Context.Tag.Service<RecorderService> = {
	startRecording: Effect.gen(function* (_) {
		stream = yield* _(getMediaStream);
		recordedChunks.length = 0;
		mediaRecorder = new AudioRecorder(stream);
		mediaRecorder.addEventListener(
			'dataavailable',
			(event: BlobEvent) => {
				if (!event.data.size) return;
				recordedChunks.push(event.data);
			},
			{ once: true }
		);
		mediaRecorder.start();
	}),
	stopRecording: Effect.tryPromise({
		try: () =>
			new Promise<Blob>((resolve) => {
				mediaRecorder.addEventListener(
					'stop',
					() => {
						const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
						recordedChunks.length = 0;
						resolve(audioBlob);
						stream.getTracks().forEach((track) => track.stop());
					},
					{ once: true }
				);
				mediaRecorder.stop();
			}),
		catch: (error) =>
			new StopMediaRecorderError({
				message: 'Error stopping media recorder and getting audio blob',
				origError: error
			})
	})
};

const getMediaStream = Effect.tryPromise({
	try: () => navigator.mediaDevices.getUserMedia({ audio: true }),
	catch: (error) =>
		new GetNavigatorMediaError({
			message: 'Error getting media stream',
			origError: error
		})
});
