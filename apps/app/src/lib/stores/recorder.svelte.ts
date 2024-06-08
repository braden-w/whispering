import { RecorderService, recorderStateSchema } from '$lib/services/RecorderService';
import { RecorderServiceLiveWeb } from '$lib/services/RecorderServiceWebLive';
import { RecorderWithStateService } from '$lib/services/RecorderWithStateService';
import type { Recording } from '$lib/services/RecordingDbService';
import { recordings, settings } from '$lib/stores';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
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

const RecorderWithSvelteStateLive = Layer.effect(
	RecorderWithStateService,
	Effect.gen(function* () {
		const recorderService = yield* RecorderService;
		const initialRecorderState = yield* recorderService.recorderState;
		let recorderState = createPersistedState({
			key: 'whispering-recorder-state',
			schema: recorderStateSchema,
			defaultValue: initialRecorderState,
		});

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
				return recorderState.value;
			},
			toggleRecording: () =>
				Effect.gen(function* () {
					if (!settings.apiKey) {
						toast.error(PleaseEnterAPIKeyToast);
						return;
					}
					yield* checkAndUpdateSelectedAudioInputDevice();
					switch (recorderState.value) {
						case 'IDLE': {
							yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
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
					if (recorderState.value === 'RECORDING' && settings.isPlaySoundEnabled)
						cancelSound.play();
					yield* Effect.logInfo('Recording cancelled');
					recorderState.value = 'IDLE';
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
