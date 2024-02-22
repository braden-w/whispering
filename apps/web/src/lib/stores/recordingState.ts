import type { Recording } from '@repo/recorder';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { createRecordings } from './recordings';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

class MediaRecorderNotInactiveError extends Data.TaggedError('MediaRecorderNotInactiveError') {}

const INITIAL_STATE = 'IDLE';
const createRecorder = ({
	onStartRecording = Effect.logInfo('Recording started'),
	onStopRecording = Effect.logInfo('Recording stopped')
}: {
	onStartRecording?: Effect.Effect<void>;
	onStopRecording?: Effect.Effect<void>;
}) =>
	Effect.gen(function* (_) {
		const recorderState = writable<RecorderState>(INITIAL_STATE);
		const recordings = createRecordings();

		const recordedChunks: Blob[] = [];

		const stream = yield* _(getMediaStream);
		const mediaRecorder = new AudioRecorder(stream);
		mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			recordedChunks.push(event.data);
		});
		const stopRecording = Effect.tryPromise({
			try: () =>
				new Promise<Blob>((resolve) => {
					mediaRecorder.addEventListener('stop', () => {
						const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
						recordedChunks.length = 0;
						resolve(audioBlob);
					});
					mediaRecorder.stream.getTracks().forEach((i) => i.stop());
					mediaRecorder.stop();
				}),
			catch: (error) => new StopMediaRecorderError({ origError: error })
		});

		return {
			recorder: {
				...recorderState,
				toggleRecording: Effect.gen(function* (_) {
					const $recorderState = get(recorderState);
					switch ($recorderState) {
						case 'IDLE': {
							if (mediaRecorder.state !== 'inactive')
								return yield* _(new MediaRecorderNotInactiveError());
							mediaRecorder.start();
							yield* _(onStartRecording);
							recorderState.set('RECORDING');
							break;
						}
						case 'RECORDING': {
							const audioBlob = yield* _(stopRecording);
							console.log('🚀 ~ toggleRecording:Effect.gen ~ audioBlob:', audioBlob);
							yield* _(onStopRecording);
							const newRecording: Recording = {
								id: nanoid(),
								title: new Date().toLocaleString(),
								subtitle: '',
								transcription: '',
								blob: audioBlob,
								state: 'UNPROCESSED'
							};
							yield* _(recordings.addRecording(newRecording));
							recorderState.set('IDLE');
							break;
						}
						case 'SAVING': {
							break;
						}
					}
				})
			},
			recordings
		};
	});

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}

class StopMediaRecorderError extends Data.TaggedError('StopMediaRecorderError')<{
	origError: unknown;
}> {}

const getMediaStream = Effect.tryPromise({
	try: () => navigator.mediaDevices.getUserMedia({ audio: true }),
	catch: (error) => new GetNavigatorMediaError({ origError: error })
});

// function onTranscribeRecording(transcription: string) {
// 	outputText.set(transcription);
// 	// await writeTextToClipboard(text);
// 	// await pasteTextFromClipboard();
// }

// await toast.promise(processRecording(audioBlob), {
// 	loading: 'Processing Whisper...',
// 	success: 'Copied to clipboard!',
// 	error: () => SomethingWentWrongToast
// });

export const { recorder, recordings } = await createRecorder({}).pipe(
	// Effect.catchAll(Effect.logError),
	Effect.runPromise
);
