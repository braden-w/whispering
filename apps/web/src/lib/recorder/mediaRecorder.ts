import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}

const getMediaStream = Effect.tryPromise(() =>
	navigator.mediaDevices.getUserMedia({ audio: true })
);

// const getMediaStream: Effect.Effect<MediaStream, GetNavigatorMediaError> = Effect.tryPromise({
// 	try: async () => {
// 		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// 		return stream
// 	},
// 	error: (error) => new GetNavigatorMediaError({ origError: error })
// });

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	mediaRecorder = new AudioRecorder(stream);
	if (!mediaRecorder) throw new Error('MediaRecorder is not initialized.');
	mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
		recordedChunks.push(event.data);
	});
	mediaRecorder.start();
}

export async function stopRecording(): Promise<Blob> {
	return new Promise((resolve) => {
		if (!mediaRecorder) throw new Error('MediaRecorder is not initialized.');
		mediaRecorder.addEventListener('stop', () => {
			const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
			recordedChunks = [];
			resolve(audioBlob);
		});
		mediaRecorder.stop();
	});
}
