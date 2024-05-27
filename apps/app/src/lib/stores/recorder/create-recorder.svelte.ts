import { createPersistedState } from '$lib/createPersistedState.svelte';
import { RecorderService } from '@repo/services/services/recorder';
import type { Recording } from '@repo/services/services/recordings-db';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import { z } from 'zod';
import { recordings } from '../recordings';

/**
 * The transcription status of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */
const recorderStateSchema = z.union([
	z.literal('IDLE'),
	z.literal('RECORDING'),
	z.literal('SAVING'),
]);

const INITIAL_STATE = 'IDLE';

export const createRecorder = Effect.gen(function* () {
	const recorderService = yield* RecorderService;
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
		refreshDefaultAudioInput: () =>
			Effect.gen(function* () {
				const recordingDevices = yield* recorderService.enumerateRecordingDevices;
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
				Effect.runPromise,
			),
		toggleRecording: () =>
			Effect.gen(function* () {
				switch (recorderState.value) {
					case 'IDLE': {
						yield* recorderService.startRecording(selectedAudioInputDeviceId.value);
						yield* Effect.logInfo('Recording started');
						recorderState.value = 'RECORDING';
						break;
					}
					case 'RECORDING': {
						const audioBlob = yield* recorderService.stopRecording;
						yield* Effect.logInfo('Recording stopped');
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
						yield* recordings.addRecording(newRecording);
						recordings.transcribeRecording(newRecording.id);
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
				Effect.runPromise,
			),
		enumerateRecordingDevices: () =>
			Effect.gen(function* () {
				return yield* recorderService.enumerateRecordingDevices;
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed([] as MediaDeviceInfo[]);
				}),
				Effect.runPromise,
			),
	};
});
