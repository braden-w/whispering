import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { NotificationServiceDesktopLive } from '$lib/services/NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from '$lib/services/NotificationServiceWebLive';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { SetTrayIconServiceDesktopLive } from '$lib/services/SetTrayIconServiceDesktopLive';
import { SetTrayIconServiceWebLive } from '$lib/services/SetTrayIconServiceWebLive';
import { ToastServiceLive } from '$lib/services/ToastServiceLive';
import { recordings } from '$lib/stores';
import {
	NotificationService,
	WhisperingError,
	type RecorderState,
	type Settings,
} from '@repo/shared';
import { Effect } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import type { Recording } from '../services/RecordingDbService';
import { renderErrorAsToast } from '../services/errors';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export let recorderState = Effect.gen(function* () {
	const { setTrayIcon } = yield* SetTrayIconService;
	let value = $state<RecorderState>('IDLE');
	return {
		get value() {
			return value;
		},
		set value(newValue: RecorderState) {
			value = newValue;
			setTrayIcon(newValue).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
		},
	};
}).pipe(
	Effect.provide(window.__TAURI__ ? SetTrayIconServiceDesktopLive : SetTrayIconServiceWebLive),
	Effect.runSync,
);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = Effect.gen(function* () {
	const mediaRecorderService = yield* MediaRecorderService;
	const { notify } = yield* NotificationService;

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
		toggleRecording: (settings: Settings) =>
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

				switch (mediaRecorderService.recordingState) {
					case 'inactive':
						yield* mediaRecorderService.startRecording(settings.selectedAudioInputDeviceId);
						yield* Effect.all([
							Effect.sync(() => (recorderState.value = 'RECORDING')),
							Effect.logInfo('Recording started'),
							Effect.gen(function* () {
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
							}).pipe(Effect.catchAll(renderErrorAsToast)),
							notify({
								id: IS_RECORDING_NOTIFICATION_ID,
								title: 'Whispering is recording...',
								description: 'Click to go to recorder',
								action: {
									label: 'Go to recorder',
									goto: '/',
								},
							}).pipe(Effect.catchAll(renderErrorAsToast)),
						]);
						return;
					case 'recording':
						const audioBlob = yield* mediaRecorderService.stopRecording;
						yield* Effect.all([
							Effect.sync(() => (recorderState.value = 'IDLE')),
							Effect.logInfo('Recording stopped'),
							Effect.gen(function* () {
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
							}).pipe(Effect.catchAll(renderErrorAsToast)),
							Effect.gen(function* () {
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
							}).pipe(Effect.catchAll(renderErrorAsToast)),
						]);
						return;
				}
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		cancelRecording: (settings: Settings) =>
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
	Effect.provide(ToastServiceLive),
	Effect.provide(window.__TAURI__ ? NotificationServiceDesktopLive : NotificationServiceWebLive),
	Effect.runSync,
);
