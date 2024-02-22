import { apiKey } from '$lib/stores/apiKey';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
export type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

/**
 * The state of the recording, which can be one of 'TRANSCRIBING' or 'DONE'.
 */
export type RecordingState = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

type Recording = {
	id: string;
	title: string;
	subtitle: string;
	transcription: string;
	src: string;
	state: RecordingState;
};

class GetApiKeyError extends Data.TaggedError('GetApiKeyError') {}
class AddRecordingToRecordingsDbError extends Data.TaggedError('AddRecordingToRecordingsDbError') {}
class EditRecordingInRecordingsDbError extends Data.TaggedError(
	'EditRecordingInRecordingsDbError'
) {}
class DeleteRecordingFromRecordingsDbError extends Data.TaggedError(
	'DeleteRecordingFromRecordingsDbError'
) {}

function createRecordings() {
	const { subscribe, update } = writable<Recording[]>([]);
	return {
		subscribe,
		addRecording: (recording: Recording) => {
			update((recordings) => [...recordings, recording]);
		},
		deleteRecording: (id: string) => {
			update((recordings) => recordings.filter((recording) => recording.id !== id));
		},
		setRecording: (id: string, recording: Recording) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index] = recording;
				return recordings;
			});
		},
		setRecordingState: (id: string, state: RecordingState) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index].state = state;
				return recordings;
			});
		},
		setRecordingTranscription: (id: string, transcription: string) => {
			update((recordings) => {
				const index = recordings.findIndex((recording) => recording.id === id);
				if (index === -1) return recordings;
				recordings[index].transcription = transcription;
				return recordings;
			});
		}
	};
}

class MediaRecorderNotInactiveError extends Data.TaggedError('MediaRecorderNotInactiveError') {}

const createRecorder = ({
	initialState = 'IDLE',
	startRecording,
	onStartRecording = Effect.logInfo('Recording started'),
	stopRecording,
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
	initialState?: RecorderState;
	startRecording: Effect.Effect<void>;
	onStartRecording?: Effect.Effect<void>;
	stopRecording: (apiKey: string) => Effect.Effect<Blob>;
	onStopRecording?: Effect.Effect<void>;
	saveRecordingToSrc: (audioBlob: Blob) => Effect.Effect<string>;
	onSaveRecordingToSrc?: Effect.Effect<void>;
	getRecordingAsBlob: (id: string) => Effect.Effect<Blob>;
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
		const recorderState = writable<RecorderState>(initialState);
		const recordings = createRecordings();

		const recordedChunks: Blob[] = [];

		const stream = yield* _(getMediaStream);
		const mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			recordedChunks.push(event.data);
		});

		const stopRecording = Effect.tryPromise({
			try: () =>
				new Promise<Blob>((resolve) => {
					mediaRecorder.onstop = () => {
						const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
						resolve(audioBlob);
					};
					mediaRecorder.stream.getTracks().forEach((i) => i.stop());
					mediaRecorder.stop();
				}),
			catch: (error) => new StopMediaRecorderError({ origError: error })
		});

		return {
			recorder: {
				...recorderState,
				toggleRecording: Effect.gen(function* (_) {
					const $apiKey = get(apiKey);
					const recordingStateValue = get(recorder);
					switch (recordingStateValue) {
						case 'IDLE': {
							yield* _(startRecording);
							if (mediaRecorder.state !== 'inactive')
								return yield* _(new MediaRecorderNotInactiveError());
							mediaRecorder.start();
							yield* _(onStartRecording);
							recorderState.set('RECORDING');
							break;
						}
						case 'RECORDING': {
							const audioBlob = yield* _(
								Effect.tryPromise({
									try: () => stopRecording(),
									catch: (error) => new GetNavigatorMediaError({ origError: error })
								})
							);
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

function onTranscribeRecording(transcription: string) {
	outputText.set(transcription);
	// await writeTextToClipboard(text);
	// await pasteTextFromClipboard();
}

// await toast.promise(processRecording(audioBlob), {
// 	loading: 'Processing Whisper...',
// 	success: 'Copied to clipboard!',
// 	error: () => SomethingWentWrongToast
// });

export const { recorder } = createRecorder({});
export const outputText = writable('');
export const audioSrc = writable('');
