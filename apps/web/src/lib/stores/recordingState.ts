import { apiKey } from '$lib/stores/apiKey';
import { recorder } from '$lib/stores/recordingState';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';
import { Data, Effect } from 'effect';
import toast from 'svelte-french-toast';
import { get, writable } from 'svelte/store';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

/**
 * The state of the recording, which can be one of 'TRANSCRIBING' or 'DONE'.
 */
type RecordingState = 'TRANSCRIBING' | 'DONE';

class GetApiKeyError extends Data.TaggedError('GetApiKeyError') {}

function createRecorder({
	initialState = 'IDLE',
	getApiKey,
	onGetApiKeyError,
	startRecording,
	onStartRecording,
	stopRecording,
	onStopRecording,
	saveRecordingToSrc,
	onSaveRecordingToSrc
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
}) {
	const recordingState = writable<RecorderState>(initialState);
	return {
		recorder: {
			...recordingState,
			toggleRecording: Effect.gen(function* (_) {
				const apiKey = yield* _(getApiKey);
				const recordingStateValue = get(recorder);
				switch (recordingStateValue) {
					case 'IDLE': {
						yield* _(startRecording);
						yield* _(onStartRecording);
						recorder.set('RECORDING');
						break;
					}
					case 'RECORDING': {
						const audioBlob = yield* _(stopRecording(apiKey));
						yield* _(onStopRecording);
						const src = yield* _(saveRecordingToSrc(audioBlob));
						yield* _(onSaveRecordingToSrc);
						recorder.set('IDLE');
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
		}
	};
}

function createRecording() {
	const recordingState = writable<RecordingState>('TRANSCRIBING');
	return {
		recording: {
			...recordingState,
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
