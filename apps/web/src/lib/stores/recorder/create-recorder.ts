import { TranscriptionComplete } from '$lib/toasts';
import persistedWritable from '@epicenterhq/svelte-persisted-writable';
import { RecorderService } from '@repo/recorder/services/recorder';
import type { Recording } from '@repo/recorder/services/recordings-db';
import { Effect, pipe } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-french-toast';
import { get, writable } from 'svelte/store';
import { z } from 'zod';
import { recordings } from '../recordings';

/**
 * The transcription status of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

const INITIAL_STATE = 'IDLE' satisfies RecorderState;

export const createRecorder = () =>
	Effect.gen(function* (_) {
		const recorderService = yield* _(RecorderService);
		const recorderState = writable<RecorderState>(INITIAL_STATE);

		const selectedAudioInputDeviceId = persistedWritable({
			key: 'selected-audio-input-device-id',
			schema: z.string(),
			initialValue: ''
		});

		return {
			recorderState,
			selectedAudioInputDeviceId,
			getAudioInputDevices: recorderService.enumerateRecordingDevices.pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed([] as MediaDeviceInfo[]);
				})
			),
			refreshDefaultAudioInput: Effect.gen(function* (_) {
				const $selectedAudioInput = get(selectedAudioInputDeviceId);
				const audioInputDevices = yield* _(recorderService.enumerateRecordingDevices);
				if (!audioInputDevices.some((device) => device.deviceId === $selectedAudioInput)) {
					const firstAudioInput = audioInputDevices[0].deviceId;
					selectedAudioInputDeviceId.set(firstAudioInput);
				}
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(undefined);
				})
			),
			toggleRecording: Effect.gen(function* (_) {
				const $recorderState = get(recorderState);
				const $selectedAudioInput = get(selectedAudioInputDeviceId);
				switch ($recorderState) {
					case 'IDLE': {
						yield* _(recorderService.startRecording($selectedAudioInput));
						yield* _(Effect.logInfo('Recording started'));
						recorderState.set('RECORDING');
						break;
					}
					case 'RECORDING': {
						const audioBlob = yield* _(recorderService.stopRecording);
						yield* _(Effect.logInfo('Recording stopped'));
						const newRecording: Recording = {
							id: nanoid(),
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob: audioBlob,
							transcriptionStatus: 'UNPROCESSED'
						};
						recorderState.set('IDLE');
						yield* _(recordings.addRecording(newRecording));
						yield* _(
							Effect.sync(() =>
								pipe(
									recordings.transcribeRecording(newRecording.id).pipe(Effect.runPromise),
									(promise) =>
										toast.promise(promise, {
											loading: 'Transcribing recording...',
											success: () => TranscriptionComplete,
											error: 'Failed to transcribe recording'
										})
								)
							)
						);
						break;
					}
					case 'SAVING': {
						break;
					}
				}
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(undefined);
				})
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
