import { createPersistedState } from '$lib/createPersistedState.svelte';
import {
	PleaseEnterAPIKeyToast,
	SomethingWentWrongToast,
	TranscriptionComplete
} from '$lib/toasts';
import { ClipboardServiceLive } from '@repo/services/implementations/clipboard/web.js';
import { ClipboardService } from '@repo/services/services/clipboard';
import { RecorderService } from '@repo/services/services/recorder';
import type { Recording } from '@repo/services/services/recordings-db';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import { z } from 'zod';
import { recordings } from '../recordings';
import type { createRecordings } from '../recordings/create-recordings.svelte';
import { settings } from '../settings.svelte';

/**
 * The transcription status of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
type RecorderState = 'IDLE' | 'RECORDING' | 'SAVING';

const INITIAL_STATE = 'IDLE' satisfies RecorderState;

export const createRecorder = () =>
	Effect.gen(function* (_) {
		const recorderService = yield* _(RecorderService);
		let recorderState = $state<RecorderState>(INITIAL_STATE);

		const selectedAudioInputDeviceId = createPersistedState({
			key: 'selected-audio-input-device-id',
			schema: z.string(),
			defaultValue: ''
		});

		return {
			get recorderState() {
				return recorderState;
			},
			selectedAudioInputDeviceId,
			getAudioInputDevices: recorderService.enumerateRecordingDevices.pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed([] as MediaDeviceInfo[]);
				})
			),
			refreshDefaultAudioInput: Effect.gen(function* (_) {
				const recordingDevices = yield* _(recorderService.enumerateRecordingDevices);
				const $selectedAudioInput = selectedAudioInputDeviceId.value;
				const isSelectedExists = recordingDevices.some(
					({ deviceId }) => deviceId === $selectedAudioInput
				);
				if (!isSelectedExists) {
					const firstAudioInput = recordingDevices[0].deviceId;
					selectedAudioInputDeviceId.value = firstAudioInput;
				}
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(undefined);
				})
			),
			toggleRecording: Effect.gen(function* (_) {
				const $selectedAudioInput = selectedAudioInputDeviceId.value;
				switch (recorderState) {
					case 'IDLE': {
						yield* _(recorderService.startRecording($selectedAudioInput));
						yield* _(Effect.logInfo('Recording started'));
						recorderState = 'RECORDING';
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
						recorderState = 'IDLE';
						yield* _(recordings.addRecording(newRecording));
						const transcribeAndCopyPromise = Effect.gen(function* (_) {
							const clipboardService = yield* _(ClipboardService);
							const transcription = yield* _(recordings.transcribeRecording(newRecording.id));
							if (settings.value.isCopyToClipboardEnabled && transcription)
								yield* _(clipboardService.setClipboardText(transcription));
							if (settings.value.isPasteContentsOnSuccessEnabled && transcription)
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
