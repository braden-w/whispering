import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export const startRecording = () =>
	Effect.gen(function* (_) {
		const stream = yield* _(getMediaStream);
		mediaRecorder = new AudioRecorder(stream);
		if (!mediaRecorder) return Effect.fail(new MediaRecorderNotInitializedError());
		mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			recordedChunks.push(event.data);
		});
		mediaRecorder.start();
	});

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}
class MediaRecorderNotInitializedError extends Data.TaggedError(
	'MediaRecorderNotInitializedError'
) {}

const getMediaStream = Effect.tryPromise({
	try: () => navigator.mediaDevices.getUserMedia({ audio: true }),
	catch: (error) => new GetNavigatorMediaError({ origError: error })
});

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
