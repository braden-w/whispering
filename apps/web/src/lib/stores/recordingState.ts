import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid';
import type { startRecording } from '$lib/recorder/mediaRecorder';
import { apiKey } from '$lib/stores/apiKey';
import { audioSrc, recorder } from '$lib/stores/recorderState';
import { setAlwaysOnTop } from '$lib/system-apis/window';
import PleaseEnterAPIKeyToast from '$lib/toasts/PleaseEnterAPIKeyToast.svelte';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';
import toast from 'svelte-french-toast';
import { get, writable } from 'svelte/store';
import { id } from 'effect/Fiber';
import { transcribeAudioWithWhisperApi } from '$lib/transcribeAudioWithWhisperApi';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

/**
 * The state of the recording, which can be one of 'TRANSCRIBING' or 'DONE'.
 */
type RecordingState = 'UNPROCESSED' | 'TRANSCRIBING' | 'DONE';

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

function createRecorder({
	initialState = 'IDLE',
	getApiKey,
	onGetApiKeyError,
	startRecording,
	onStartRecording,
	stopRecording,
	onStopRecording,
	saveRecordingToSrc,
	onSaveRecordingToSrc,
	getRecordingAsBlob,
	addRecordingToRecordingsDb,
	editRecordingInRecordingsDb,
	deleteRecordingFromRecordingsDb,
	transcribeAudioWithWhisperApi
}: {
	initialState?: RecorderState;
	getApiKey: Effect.Effect<string, GetApiKeyError>;
	onGetApiKeyError: (error: GetApiKeyError) => Effect.Effect<void>;
	startRecording: Effect.Effect<void>;
	onStartRecording: Effect.Effect<void>;
	stopRecording: (apiKey: string) => Effect.Effect<Blob>;
	onStopRecording: Effect.Effect<void>;
	saveRecordingToSrc: (audioBlob: Blob) => Effect.Effect<string>;
	onSaveRecordingToSrc: Effect.Effect<void>;
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
}) {
	const recorderState = writable<RecorderState>(initialState);
	const recordings = createRecordings();
	return {
		recorder: {
			...recorderState,
			toggleRecording: Effect.gen(function* (_) {
				const apiKey = yield* _(getApiKey);
				const recordingStateValue = get(recorder);
				switch (recordingStateValue) {
					case 'IDLE': {
						yield* _(startRecording);
						yield* _(onStartRecording);
						recorderState.set('RECORDING');
						break;
					}
					case 'RECORDING': {
						const audioBlob = yield* _(stopRecording(apiKey));
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
			}).pipe(
				Effect.catchTags({
					GetApiKeyError: onGetApiKeyError
				})
			)
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
					recordings.setRecordingState(id, 'DONE');
					recordings.setRecordingTranscription(id, transcription);
				})
		}
	};
}

function createRecording() {
	const recorderState = writable<RecordingState>('TRANSCRIBING');
	return {
		recording: {
			...recorderState,
			processRecording: async (audioBlob: Blob) => {
				const text = await transcribeAudioWithWhisperApi(audioBlob, get(apiKey));
				outputText.set(text);
				await writeTextToClipboard(text);
				await pasteTextFromClipboard();
			}
		}
	};
}
await toast.promise(processRecording(audioBlob), {
	loading: 'Processing Whisper...',
	success: 'Copied to clipboard!',
	error: () => SomethingWentWrongToast
});

export const { recorder } = createRecorder();
export const outputText = writable('');
export const audioSrc = writable('');
