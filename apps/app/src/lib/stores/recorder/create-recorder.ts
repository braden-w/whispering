import {
	PleaseEnterAPIKeyToast,
	SomethingWentWrongToast,
	TranscriptionComplete
} from '$lib/toasts';
import persistedWritable from '@epicenterhq/svelte-persisted-writable';
import { ClipboardServiceLive } from '@repo/services/implementations/clipboard/web.js';
import { ClipboardService } from '@repo/services/services/clipboard';
import { RecorderService } from '@repo/services/services/recorder';
import type { Recording } from '@repo/services/services/recordings-db';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { z } from 'zod';
import { recordings } from '../recordings';
import type { createRecordings } from '../recordings/create-recordings';
import { settings } from '../settings';

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
				const recordingDevices = yield* _(recorderService.enumerateRecordingDevices);
				const $selectedAudioInput = get(selectedAudioInputDeviceId);
				const isSelectedExists = recordingDevices.some(
					({ deviceId }) => deviceId === $selectedAudioInput
				);
				if (!isSelectedExists) {
					const firstAudioInput = recordingDevices[0].deviceId;
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
						const transcribeAndCopyPromise = Effect.gen(function* (_) {
							const clipboardService = yield* _(ClipboardService);
							const transcription = yield* _(recordings.transcribeRecording(newRecording.id));
							const $settings = get(settings);
							if ($settings.isCopyToClipboardEnabled && transcription)
								yield* _(clipboardService.setClipboardText(transcription));
							if ($settings.isPasteContentsOnSuccessEnabled && transcription)
								yield* _(clipboardService.pasteTextFromClipboard);
						}).pipe(Effect.provide(ClipboardServiceLive), Effect.runPromise);
						toast.promise(transcribeAndCopyPromise, {
							loading: 'Transcribing recording...',
							success: () => TranscriptionComplete,
							error: (
								e: Effect.Effect.Error<
									ReturnType<Effect.Effect.Success<typeof createRecordings>['transcribeRecording']>
								>
							) => {
								if (e.name === 'PleaseEnterApiKeyError') return PleaseEnterAPIKeyToast;
								return SomethingWentWrongToast;
							}
						});
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
