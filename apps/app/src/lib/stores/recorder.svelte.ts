import { recordings, settings } from '$lib/stores';
import { RecorderServiceLiveWeb } from '@repo/services/implementations/recorder';
import { RecorderService } from '@repo/services/services/recorder';
import { RecorderWithStateService } from '@repo/services/services/recorder-with-state';
import type { Recording } from '@repo/services/services/recordings-db';
import { PleaseEnterAPIKeyToast } from '@repo/ui/toasts';
import { Effect, Layer } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

/**
 * The transcription status of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */

const INITIAL_STATE = 'IDLE';

const RecorderWithSvelteStateLive = Layer.effect(
	RecorderWithStateService,
	Effect.gen(function* () {
		const recorderService = yield* RecorderService;
		let recorderState = $state<'IDLE' | 'RECORDING'>(INITIAL_STATE);

		const checkAndUpdateSelectedAudioInputDevice = () =>
			Effect.gen(function* () {
				const recordingDevices = yield* recorderService.enumerateRecordingDevices;
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					toast.info('Default audio input device not found, selecting first available device');
					const firstAudioInput = recordingDevices[0].deviceId;
					settings.selectedAudioInputDeviceId = firstAudioInput;
				}
			}).pipe(
				Effect.catchAll((error) => {
					toast.error(error.message);
					return Effect.succeed(undefined);
				}),
			);

		return {
			get recorderState() {
				return recorderState;
			},
			toggleRecording: () =>
				Effect.gen(function* () {
					if (!settings.apiKey) {
						toast.error(PleaseEnterAPIKeyToast);
						return;
					}
					yield* checkAndUpdateSelectedAudioInputDevice();
					switch (recorderState) {
						case 'IDLE': {
							yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
							if (settings.isPlaySoundEnabled) startSound.play();
							yield* Effect.logInfo('Recording started');
							recorderState = 'RECORDING';
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
							recorderState = 'IDLE';
							yield* recordings.addRecording(newRecording);
							recordings.transcribeRecording(newRecording.id);
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
			cancelRecording: () =>
				Effect.gen(function* () {
					yield* recorderService.cancelRecording;
					if (recorderState === 'RECORDING' && settings.isPlaySoundEnabled) cancelSound.play();
					yield* Effect.logInfo('Recording cancelled');
					recorderState = 'IDLE';
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
	}),
);

export const recorder = Effect.gen(function* () {
	const recorderWithState = yield* RecorderWithStateService;
	return recorderWithState;
}).pipe(
	Effect.provide(RecorderWithSvelteStateLive),
	Effect.provide(RecorderServiceLiveWeb),
	Effect.runSync,
);
