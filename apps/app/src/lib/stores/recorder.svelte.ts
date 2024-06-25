import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { MediaRecorderServiceWebLive } from '$lib/services/MediaRecorderServiceWebLive';
import { NotificationServiceDesktopLive } from '$lib/services/NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from '$lib/services/NotificationServiceWebLive';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { SetTrayIconServiceDesktopLive } from '$lib/services/SetTrayIconServiceDesktopLive';
import { SetTrayIconServiceWebLive } from '$lib/services/SetTrayIconServiceWebLive';
import { ToastServiceLive } from '$lib/services/ToastServiceLive';
import { recordings, settings } from '$lib/stores';
import { NotificationService, WhisperingError, type RecorderState } from '@repo/shared';
import { ToastService } from '$lib/services/ToastService';
import { Effect } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import type { Recording } from '../services/RecordingDbService';
import { renderErrorAsToast } from '../services/errors';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { goto } from '$app/navigation';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export let recorderState = (() => {
	let value = $state<RecorderState>('IDLE');
	return {
		get value() {
			return value;
		},
		set value(newValue: RecorderState) {
			value = newValue;
			Effect.gen(function* () {
				const { setTrayIcon } = yield* SetTrayIconService;
				yield* setTrayIcon(newValue);
			}).pipe(
				Effect.provide(
					window.__TAURI__ ? SetTrayIconServiceDesktopLive : SetTrayIconServiceWebLive,
				),
				Effect.catchAll(renderErrorAsToast),
				Effect.runPromise,
			);
		},
	};
})();

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = Effect.gen(function* () {
	const mediaRecorderService = yield* MediaRecorderService;
	const { toast } = yield* ToastService;
	const { notify, clear } = yield* NotificationService;

	return {
		get recorderState() {
			return recorderState.value;
		},
		enumerateRecordingDevices: () =>
			mediaRecorderService.enumerateRecordingDevices.pipe(
				Effect.catchAll((error) => {
					renderErrorAsToast(error);
					return Effect.succeed([] as MediaDeviceInfo[]);
				}),
				Effect.runPromise,
			),
		toggleRecording: () =>
			Effect.gen(function* () {
				if (!settings.apiKey) {
					return yield* new WhisperingError({
						title: 'API Key not provided.',
						description: 'Please enter your OpenAI API key in the settings',
						action: {
							label: 'Go to settings',
							goto: '/settings',
						},
					});
				}

				const recordingDevices = yield* mediaRecorderService.enumerateRecordingDevices;
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					yield* toast({
						variant: 'info',
						title: 'Defaulting to first available audio input device...',
						description: 'No device selected or selected device is not available',
					});
					const firstAudioInput = recordingDevices[0].deviceId;
					settings.selectedAudioInputDeviceId = firstAudioInput;
				}

				switch (mediaRecorderService.recordingState) {
					case 'inactive':
						yield* mediaRecorderService.startRecording(settings.selectedAudioInputDeviceId);
						if (settings.isPlaySoundEnabled) {
							if (!document.hidden) {
								startSound.play();
							} else {
								yield* sendMessageToExtension({
									name: 'external/playSound',
									body: { sound: 'start' },
								});
							}
						}
						yield* Effect.logInfo('Recording started');
						recorderState.value = 'RECORDING';
						yield* notify({
							id: IS_RECORDING_NOTIFICATION_ID,
							title: 'Whispering is recording...',
							description: 'Click to go to recorder',
							action: {
								label: 'Go to recorder',
								goto: '/',
							},
						});
						return;
					case 'recording':
						const audioBlob = yield* mediaRecorderService.stopRecording;
						if (settings.isPlaySoundEnabled) {
							if (!document.hidden) {
								stopSound.play();
							} else {
								yield* sendMessageToExtension({
									name: 'external/playSound',
									body: { sound: 'stop' },
								});
							}
						}
						yield* Effect.logInfo('Recording stopped');
						recorderState.value = 'IDLE';
						const newRecording: Recording = {
							id: nanoid(),
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob: audioBlob,
							transcriptionStatus: 'UNPROCESSED',
						};
						yield* recordings.addRecording(newRecording);
						recordings.transcribeRecording(newRecording.id);
						return;
				}
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		cancelRecording: () =>
			Effect.gen(function* () {
				yield* mediaRecorderService.cancelRecording;
				if (settings.isPlaySoundEnabled) {
					if (!document.hidden) {
						cancelSound.play();
					} else {
						yield* sendMessageToExtension({
							name: 'external/playSound',
							body: { sound: 'cancel' },
						});
					}
				}
				yield* Effect.logInfo('Recording cancelled');
				recorderState.value = 'IDLE';
			}).pipe(Effect.runPromise),
	};
}).pipe(
	Effect.provide(MediaRecorderServiceWebLive),
	Effect.provide(ToastServiceLive),
	Effect.provide(window.__TAURI__ ? NotificationServiceDesktopLive : NotificationServiceWebLive),
	Effect.runSync,
);
