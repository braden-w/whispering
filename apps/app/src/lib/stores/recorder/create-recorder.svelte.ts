import { createPersistedState } from '$lib/createPersistedState.svelte';
import { RecorderService } from '@repo/services/services/recorder';
import type { Recording } from '@repo/services/services/recordings-db';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import { z } from 'zod';
import { recordings } from '../recordings';
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

const startSound = new Audio('/zapsplat_household_alarm_clock_button_press_12967.mp3');
const stopSound = new Audio('/sound_ex_machina_Button_Blip.mp3');

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

	const checkAndUpdateSelectedAudioInputDevice = Effect.gen(function* () {
		const recordingDevices = yield* recorderService.enumerateRecordingDevices;
		const isSelectedDeviceExists = recordingDevices.some(
			({ deviceId }) => deviceId === selectedAudioInputDeviceId.value,
		);
		if (!isSelectedDeviceExists) {
			toast.info('Default audio input device not found, selecting first available device');
			const firstAudioInput = recordingDevices[0].deviceId;
			selectedAudioInputDeviceId.value = firstAudioInput;
		}
	}).pipe(
		Effect.catchAll((error) => {
			toast.error(error.message);
			return Effect.succeed(undefined);
		}),
	);

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
		toggleRecording: () =>
			Effect.gen(function* () {
				yield* checkAndUpdateSelectedAudioInputDevice;
				switch (recorderState.value) {
					case 'IDLE': {
						yield* recorderService.startRecording(selectedAudioInputDeviceId.value);
						if (settings.isPlaySoundEnabled) startSound.play();
						yield* Effect.logInfo('Recording started');
						recorderState.value = 'RECORDING';
						break;
					}
					case 'RECORDING': {
						const audioBlob = yield* recorderService.stopRecording;
						if (settings.isPlaySoundEnabled) stopSound.play();
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
