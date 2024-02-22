import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}

class MediaRecorderNotInitializedError extends Data.TaggedError(
	'MediaRecorderNotInitializedError'
) {}

class MediaRecorderNotInactiveError extends Data.TaggedError('MediaRecorderNotInactiveError') {}

const getMediaStream = Effect.tryPromise({
	try: () => navigator.mediaDevices.getUserMedia({ audio: true }),
	catch: (error) => new GetNavigatorMediaError({ origError: error })
});

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export const startRecording = () =>
	Effect.gen(function* (_) {
		if (!mediaRecorder) {
			const stream = yield* _(getMediaStream);
			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				recordedChunks.push(event.data);
			});
		}
		if (mediaRecorder.state !== 'inactive') return yield* _(new MediaRecorderNotInactiveError());
		mediaRecorder.start();
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
