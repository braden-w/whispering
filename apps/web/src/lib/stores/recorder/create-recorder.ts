import type { Recording } from '@repo/recorder/services/recordings-db';
import { RecorderService } from '@repo/recorder/services/recorder';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { recordings } from '../recordings';

/**
 * The state of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

const INITIAL_STATE = 'IDLE';

export const createRecorder = ({
	onStartRecording = Effect.logInfo('Recording started'),
	onStopRecording = Effect.logInfo('Recording stopped')
}: {
	onStartRecording?: Effect.Effect<void>;
	onStopRecording?: Effect.Effect<void>;
}) =>
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
							yield* _(onStartRecording);
							recorderState.set('RECORDING');
							break;
						}
						case 'RECORDING': {
							const audioBlob = yield* _(recorderService.stopRecording);
							yield* _(onStopRecording);
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
				}).pipe(Effect.catchTags({}), Effect.runPromise)
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
