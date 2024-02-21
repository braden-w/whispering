import { Data, Effect } from 'effect';
import type { startRecording } from '$lib/recorder/mediaRecorder';
import { apiKey } from '$lib/stores/apiKey';
import { audioSrc, recorder } from '$lib/stores/recordingState';
import { setAlwaysOnTop } from '$lib/system-apis/window';
import PleaseEnterAPIKeyToast from '$lib/toasts/PleaseEnterAPIKeyToast.svelte';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';
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
	initial = 'IDLE',
	getApiKey,
	onGetApiKeyError,
	startRecording,
	onStartRecording,
	stopRecording,
	onStopRecording
}: {
	initial?: RecorderState;
	getApiKey: Effect.Effect<string, GetApiKeyError>;
	onGetApiKeyError: (error: GetApiKeyError) => Effect.Effect<void>;
	startRecording: Effect.Effect<void>;
	onStartRecording: Effect.Effect<void>;
	stopRecording: (apiKey: string) => Effect.Effect<Blob>;
	onStopRecording: Effect.Effect<void>;
}) {
	const recordingState = writable<RecorderState>(initial);
	return {
		recorder: {
			...recordingState,
			toggleRecording: Effect.gen(function* (_) {
				const apiKey = yield* _(getApiKey);
				const recordingStateValue = get(recorder);
				if (recordingStateValue === 'IDLE') {
					yield* _(startRecording);
					yield* _(onStartRecording);
					recorder.set('RECORDING');
				} else {
					const audioBlob = yield* _(stopRecording(apiKey));
					audioSrc.set(URL.createObjectURL(audioBlob));
					recorder.set('SAVING');
					yield* _(onStopRecording);
					recorder.set('IDLE');
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
