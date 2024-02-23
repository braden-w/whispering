import { RecordingsDbService, type Recording } from '@repo/recorder';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { createRecordings } from './recordings';
import { indexDb } from './recordings/db';

export const recordings = createRecordings
	.pipe(Effect.provideService(RecordingsDbService, indexDb))
	.pipe(Effect.runSync);

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

const INITIAL_STATE = 'IDLE';
function createRecorder({
	onStartRecording = Effect.logInfo('Recording started'),
	onStopRecording = Effect.logInfo('Recording stopped'),
	recordings
}: {
	onStartRecording?: Effect.Effect<void>;
	onStopRecording?: Effect.Effect<void>;
	recordings: Effect.Effect.Success<typeof createRecordings>;
}) {
	const recorderState = writable<RecorderState>(INITIAL_STATE);

	let stream: MediaStream;
	let mediaRecorder: MediaRecorder;
	const recordedChunks: Blob[] = [];

	const startRecording = Effect.gen(function* (_) {
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
	});
	const stopRecording = Effect.tryPromise({
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
		catch: (error) => new StopMediaRecorderError({ origError: error })
	});

	return {
		subscribe: recorderState.subscribe,
		toggleRecording: Effect.gen(function* (_) {
			const $recorderState = get(recorderState);
			switch ($recorderState) {
				case 'IDLE': {
					yield* _(startRecording);
					yield* _(onStartRecording);
					recorderState.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					const audioBlob = yield* _(stopRecording);
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
	};
}

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
export const recorder = createRecorder({});
