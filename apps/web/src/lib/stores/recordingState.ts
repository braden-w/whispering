import { apiKey } from '$lib/stores/apiKey';
import type { Recording } from '@repo/recorder';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { createRecordings } from './recordings';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

class GetRecordingAsBlobError extends Data.TaggedError('GetRecordingAsBlobError')<{
	origError: unknown;
}> {}
class MediaRecorderNotInactiveError extends Data.TaggedError('MediaRecorderNotInactiveError') {}

const INITIAL_STATE = 'IDLE';
const createRecorder = ({
	onStartRecording = Effect.logInfo('Recording started'),
	onStopRecording = Effect.logInfo('Recording stopped'),
	saveRecordingToSrc,
	onSaveRecordingToSrc = Effect.logInfo('Recording saved to src'),
	getRecordingAsBlob,
	addRecordingToRecordingsDb,
	editRecordingInRecordingsDb,
	deleteRecordingFromRecordingsDb,
	transcribeAudioWithWhisperApi,
	onTranscribeRecording = (transcription: string) =>
		Effect.logInfo(`Transcription: ${transcription}`)
}: {
	onStartRecording?: Effect.Effect<void>;
	onStopRecording?: Effect.Effect<void>;
	saveRecordingToSrc: (audioBlob: Blob) => Effect.Effect<string>;
	onSaveRecordingToSrc?: Effect.Effect<void>;
	getRecordingAsBlob: (id: string) => Effect.Effect<Blob, GetRecordingAsBlobError>;
	addRecordingToRecordingsDb: (
		recording: Recording
	) => Effect.Effect<void, AddRecordingToRecordingsDbError>;
	editRecordingInRecordingsDb: (
		id: string,
		recording: Recording
	) => Effect.Effect<void, EditRecordingInRecordingsDbError>;
	deleteRecordingFromRecordingsDb: (
		id: string
	) => Effect.Effect<void, DeleteRecordingFromRecordingsDbError>;
	transcribeAudioWithWhisperApi: (audioBlob: Blob, apiKey: string) => Effect.Effect<string>;
	onTranscribeRecording?: (transcription: string) => Effect.Effect<void>;
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
					// mediaRecorder.stream.getTracks().forEach((i) => i.stop());
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
							yield* _(onStopRecording);
							const src = yield* _(saveRecordingToSrc(audioBlob));
							yield* _(onSaveRecordingToSrc);
							const newRecording: Recording = {
								id: nanoid(),
								title: new Date().toLocaleString(),
								subtitle: '',
								transcription: '',
								src,
								state: 'UNPROCESSED'
							};
							yield* _(addRecordingToRecordingsDb(newRecording));
							recordings.addRecording(newRecording);
							recorderState.set('IDLE');
							break;
						}
						case 'SAVING': {
							break;
						}
					}
				}).pipe(Effect.catchTags({}))
			},
			recordings: {
				...recordings,
				editRecording: (id: string, recording: Recording) =>
					Effect.gen(function* (_) {
						yield* _(editRecordingInRecordingsDb(id, recording));
						recordings.setRecording(id, recording);
					}),
				deleteRecording: (id: string) =>
					Effect.gen(function* (_) {
						yield* _(deleteRecordingFromRecordingsDb(id));
						recordings.deleteRecording(id);
					}),
				transcribeRecording: (id: string) =>
					Effect.gen(function* (_) {
						const $apiKey = get(apiKey);
						const recordingBlob = yield* _(getRecordingAsBlob(id));
						recordings.setRecordingState(id, 'TRANSCRIBING');
						const transcription = yield* _(transcribeAudioWithWhisperApi(recordingBlob, $apiKey));
						yield* _(onTranscribeRecording(transcription));
						recordings.setRecordingState(id, 'DONE');
						recordings.setRecordingTranscription(id, transcription);
					})
			}
		};
	});

class GetNavigatorMediaError extends Data.TaggedError('GetNavigatorMediaError')<{
	origError: unknown;
}> {}

class StopMediaRecorderError extends Data.TaggedError('StopMediaRecorderError')<{
	origError: unknown;
}> {}

class MediaRecorderNotInitializedError extends Data.TaggedError(
	'MediaRecorderNotInitializedError'
) {}

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

// async getRecording(id: string): Promise<Recording | undefined> {
//     const db = await this.getDB();
//     const tx = db.transaction(RECORDING_STORE, 'readonly');
//     const store = tx.objectStore(RECORDING_STORE);
//     return store.get(id);
// }

// async updateRecording(recording: Recording): Promise<void> {
//     const db = await this.getDB();
//     const tx = db.transaction(RECORDING_STORE, 'readwrite');
//     const store = tx.objectStore(RECORDING_STORE);
//     store.put(recording);
//     return tx.complete;
// }

// async deleteRecording(id: string): Promise<void> {
//     const db = await this.getDB();
//     const tx = db.transaction(RECORDING_STORE, 'readwrite');
//     const store = tx.objectStore(RECORDING_STORE);
//     store.delete(id);
//     return tx.complete;
// }

export const { recorder } = await createRecorder({
	saveRecordingToSrc: (audioBlob) => Effect.sync(() => URL.createObjectURL(audioBlob)),
	addRecordingToRecordingsDb: (recording) =>
		Effect.tryPromise({
			try: async () => {},
			catch: (error) => new AddRecordingToRecordingsDbError({ origError: error })
		}),
	editRecordingInRecordingsDb: (id, recording) =>
		Effect.logInfo('Recording added to recordings db'),
	deleteRecordingFromRecordingsDb: (id) => Effect.logInfo('Recording added to recordings db'),
	getRecordingAsBlob: (id) =>
		Effect.tryPromise({
			try: async () => {
				const db = await openDB(DB_NAME, DB_VERSION);
				const tx = db.transaction(RECORDING_STORE, 'readonly');
				const store = tx.objectStore(RECORDING_STORE);
				const recording = await store.get(id);
				if (!recording) throw new Error(`Recording with id ${id} not found`);
				return fetch(recording.src).then((res) => res.blob());
			},
			catch: (error) => new GetRecordingAsBlobError({ origError: error })
		}),
	transcribeAudioWithWhisperApi: (audioBlob, apiKey) =>
		Effect.logInfo('Recording added to recordings db')
}).pipe(Effect.catchAll(Effect.logError), Effect.runPromise);
