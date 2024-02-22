import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}

class MediaRecorderNotInactiveError extends Data.TaggedError('MediaRecorderNotInactiveError') {}

const getMediaStream = Effect.tryPromise({
	try: () => navigator.mediaDevices.getUserMedia({ audio: true }),
	catch: (error) => new GetNavigatorMediaError({ origError: error })
});

export const useRecording = ({ handleBlob }: { handleBlob: (blob: Blob) => void }) =>
	Effect.gen(function* (_) {
		const recordedChunks: Blob[] = [];
		const stream = yield* _(getMediaStream);
		const mediaRecorder = new AudioRecorder(stream);
		mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			recordedChunks.push(event.data);
		});
		if (mediaRecorder.state !== 'inactive') return yield* _(new MediaRecorderNotInactiveError());
		mediaRecorder.start();
		mediaRecorder.onstop = () => {
			const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
			handleBlob(audioBlob);
		};
		return {
			stopRecording: Effect.sync(() => mediaRecorder.stop())
		};
	});
