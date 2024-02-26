import type { Recording } from '@repo/recorder/services/recordings-db';
import { RecorderService } from '@repo/recorder/services/recorder';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { recordings } from '../recordings';
import { toast } from '@repo/ui/components/sonner';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

const INITIAL_STATE = 'IDLE';

export const createRecorder = () =>
	Effect.gen(function* (_) {
		const recorderService = yield* _(RecorderService);
		const recorderState = writable<RecorderState>(INITIAL_STATE);

		return {
			subscribe: recorderState.subscribe,
			toggleRecording: () =>
				Effect.gen(function* (_) {
					const $recorderState = get(recorderState);
					switch ($recorderState) {
						case 'IDLE': {
							yield* _(recorderService.startRecording);
							yield* _(Effect.logInfo('Recording started'));
							recorderState.set('RECORDING');
							break;
						}
						case 'RECORDING': {
							const audioBlob = yield* _(recorderService.stopRecording);
							yield* _(Effect.logInfo('Recording stopped'));
							const newRecording: Recording = {
								id: nanoid(),
								title: new Date().toLocaleString(),
								subtitle: '',
								transcribedText: '',
								blob: audioBlob,
								state: 'UNPROCESSED'
							};
							recorderState.set('IDLE');
							//  TODO: Extract to onSuccessfulRecording
							yield* _(recordings.addRecording(newRecording));
							yield* _(recordings.transcribeRecording(newRecording.id));

							break;
						}
						case 'SAVING': {
							break;
						}
					}
				}).pipe(
					Effect.catchTags({
						RecorderError: (error) => {
							toast.error(error.message);
							return Effect.succeed(error.message);
						},
						RecordingDbError: (error) => {
							toast.error(error.message);
							return Effect.succeed(error.message);
						},
						TranscribeError: (error) => {
							toast.error(error.message);
							return Effect.succeed(error.message);
						}
					}),
					Effect.runPromise
				)
		};
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
