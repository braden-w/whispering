import { createPersistedState } from '$lib/createPersistedState.svelte';
import {
	PleaseEnterAPIKeyToast,
	SomethingWentWrongToast,
	TranscriptionComplete,
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
const recorderStateSchema = z.union([
	z.literal('IDLE'),
	z.literal('RECORDING'),
	z.literal('SAVING'),
]);

const INITIAL_STATE = 'IDLE';

export const createRecorder = () =>
	Effect.gen(function* (_) {
		const recorderService = yield* _(RecorderService);
		const recorderState = createPersistedState({
			key: 'whispering-recorder-state',
			schema: recorderStateSchema,
			defaultValue: INITIAL_STATE,
		});

		const selectedAudioInputDeviceId = createPersistedState({
			key: 'whispering-selected-audio-input-device-id',
			schema: z.string(),
			defaultValue: '',
		});

		return {
			get recorderState() {
				return recorderState.value;
			},
			get selectedAudioInputDeviceId() {
				return selectedAudioInputDeviceId.value;
			},
			set selectedAudioInputDeviceId(value: string) {
				selectedAudioInputDeviceId.value = value;
			},
			refreshDefaultAudioInput: Effect.gen(function* (_) {
				const recordingDevices = yield* _(recorderService.enumerateRecordingDevices);
				const $selectedAudioInput = selectedAudioInputDeviceId.value;
				const isSelectedExists = recordingDevices.some(
					({ deviceId }) => deviceId === $selectedAudioInput,
				);
				if (!isSelectedExists) {
					const firstAudioInput = recordingDevices[0].deviceId;
					selectedAudioInputDeviceId.value = firstAudioInput;
				}
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(undefined);
				}),
			),
			toggleRecording: Effect.gen(function* (_) {
				const $selectedAudioInput = selectedAudioInputDeviceId.value;
				switch (recorderState.value) {
					case 'IDLE': {
						yield* _(recorderService.startRecording($selectedAudioInput));
						yield* _(Effect.logInfo('Recording started'));
						recorderState.value = 'RECORDING';
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
							transcriptionStatus: 'UNPROCESSED',
						};
						recorderState.value = 'IDLE';
						yield* _(recordings.addRecording(newRecording));
						recordings.transcribeRecording(newRecording.id).pipe(Effect.runPromise);
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
				}),
			),
		};
	});
